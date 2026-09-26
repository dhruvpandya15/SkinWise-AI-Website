import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    const { assessment, facePhoto } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    console.log('Received assessment:', JSON.stringify(assessment));

    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      console.error('Neither GEMINI_API_KEY nor LOVABLE_API_KEY is configured');
      throw new Error('AI credentials not configured in Edge Function');
    }

    // Build allergy avoidance list
    const allergiesToAvoid = assessment.allergies?.length > 0 
      ? `IMPORTANT: User has allergies to: ${assessment.allergies.join(', ')}. Do NOT recommend products containing these ingredients.`
      : '';

    // Map budget to price expectations
    const budgetMap: Record<string, { description: string; max: number | null; min: number }> = {
      'budget': { description: 'affordable products strictly under ₹500 INR each', max: 500, min: 0 },
      'mid': { description: 'mid-range products between ₹500-₹1500 INR each', max: 1500, min: 500 },
      'premium': { description: 'premium products between ₹1500-₹3000 INR each', max: 3000, min: 1500 },
      'luxury': { description: 'high-end luxury products over ₹3000 INR each', max: null, min: 3000 }
    };
    const budgetInfo = budgetMap[assessment.budget_range] || { description: 'products across various price points', max: null, min: 0 };
    const budgetDescription = budgetInfo.description;

    const facePhotoInstruction = facePhoto
      ? `\n\nIMPORTANT: A face photo has been provided for visual skin analysis. Carefully examine the photo to identify visible skin conditions such as acne, dryness, redness, dark spots, wrinkles, oiliness, or texture issues. Factor your visual observations into the product recommendations alongside the stated profile data. Mention any visible observations in the summary.`
      : '';

    const prompt = `You are a skincare expert specializing in Indian skincare products. Analyze this user's skin profile and recommend 5 specific, REAL skincare products available in India.${facePhotoInstruction}

USER PROFILE:
- Age Range: ${assessment.age_range}
- Skin Type: ${assessment.skin_type}
- Skin Concerns: ${assessment.skin_concerns?.join(', ') || 'None specified'}
- Climate: ${assessment.climate || 'Moderate'}
- Goals: ${assessment.skin_goals || 'General skincare improvement'}
- Budget: ${assessment.budget_range} (recommend ${budgetDescription})

${allergiesToAvoid}

REQUIREMENTS:
1. Recommend REAL products from brands available in India like Minimalist, Dot & Key, Plum, Mamaearth, The Derma Co, Cetaphil, Biotique, Lakme, Re'equil, Deconstruct, Fixderma, Episoft, Cipla, etc.
2. CRITICAL BUDGET RULE: Every single product MUST cost ${budgetDescription}. ${budgetInfo.max ? `No product should exceed ₹${budgetInfo.max}.` : ''} ${budgetInfo.min > 0 ? `No product should be below ₹${budgetInfo.min}.` : ''} Double-check each price before including it. If a product is outside the budget range, replace it with a cheaper/appropriate alternative.
3. The "priceRange" field must show the approximate MRP on Indian e-commerce sites (Amazon India, Nykaa, Flipkart). Be as accurate as possible with real current prices.
4. Include a cleanser, moisturizer, and treatments for their specific concerns
5. Each product must be purchasable on Indian e-commerce platforms (Amazon India, Nykaa, Flipkart, etc.)
${facePhoto ? '6. Reference specific visible skin observations from the photo in your summary and product justifications' : ''}

Return ONLY valid JSON in this exact format:
{
  "summary": "A 2-3 sentence personalized summary of why these products suit this user${facePhoto ? ', including observations from their face photo' : ''}",
  "products": [
    {
      "name": "Exact Product Name",
      "brand": "Brand Name",
      "description": "What this product does",
      "keyIngredients": ["ingredient1", "ingredient2", "ingredient3"],
      "priceRange": "₹XXX",
      "whySuitable": "Why this specific product addresses their skin type and concerns",
      "usageInstructions": "When and how to use (e.g., 'Apply morning and night after cleansing')",
      "category": "cleanser"
    }
  ]
}`;

    let content = '';

    if (GEMINI_API_KEY) {
      console.log('Calling Google Gemini API directly...');
      const parts: any[] = [{ text: prompt }];

      if (facePhoto && facePhoto.startsWith('data:image/')) {
        const mimeType = facePhoto.substring(5, facePhoto.indexOf(';'));
        const base64Data = facePhoto.substring(facePhoto.indexOf(',') + 1);
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const geminiData = await response.json();
      content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      console.log('Calling Lovable AI Gateway...');
      const userContent: any = facePhoto
        ? [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: facePhoto },
            },
          ]
        : prompt;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are an expert skincare consultant with visual skin analysis capabilities. Always respond with valid JSON only, no markdown formatting.' },
            { role: 'user', content: userContent }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        throw new Error(`AI request failed: ${response.status}`);
      }

      const aiData = await response.json();
      content = aiData.choices?.[0]?.message?.content || '';
    }

    console.log('AI response received');
    
    // Clean up markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(content);
      console.log('Parsed products count:', result.products?.length);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI recommendations');
    }

    if (!result.products || result.products.length === 0) {
      console.error('No products in AI response');
      throw new Error('No product recommendations generated');
    }

    // Enrich products with purchase URLs using Firecrawl
    if (FIRECRAWL_API_KEY) {
      console.log('Enriching products with Firecrawl...');
      
      const enrichedProducts = await Promise.all(
        result.products.map(async (product: any) => {
          try {
            const searchQuery = `${product.brand} ${product.name} buy India`;
            console.log(`Searching for: ${searchQuery}`);
            
            const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                query: searchQuery, 
                limit: 5 
              }),
            });
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              console.log(`Search results for ${product.name}:`, searchData.data?.length || 0);
              
              const shoppingDomains = ['amazon.in', 'nykaa.com', 'flipkart.com', 'purplle.com', 'myntra.com', 'tatacliq.com', 'netmeds.com', '1mg.com'];
              
              let productUrl = null;
              for (const result of searchData.data || []) {
                const url = result.url?.toLowerCase() || '';
                if (shoppingDomains.some(domain => url.includes(domain))) {
                  productUrl = result.url;
                  break;
                }
              }
              
              if (!productUrl && searchData.data?.[0]?.url) {
                productUrl = searchData.data[0].url;
              }
              
              return { ...product, productUrl };
            }
          } catch (e) {
            console.error(`Firecrawl search failed for ${product.name}:`, e);
          }
          return product;
        })
      );
      
      result.products = enrichedProducts;
    } else {
      console.log('No FIRECRAWL_API_KEY, skipping URL enrichment');
      
      result.products = result.products.map((product: any) => ({
        ...product,
        productUrl: `https://www.amazon.in/s?k=${encodeURIComponent(product.brand + ' ' + product.name)}`
      }));
    }

    console.log('Returning', result.products.length, 'products');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, products: [], summary: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
