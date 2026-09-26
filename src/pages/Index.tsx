import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  ChevronRight,
  Heart,
  History,
  LogOut,
  User,
  Zap
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-card/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo className="h-10 w-auto transition-transform hover:scale-105" />
          </div>
          
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="text-muted-foreground hover:text-accent-foreground"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">History</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/favorites')}
                  className="text-muted-foreground hover:text-accent-foreground"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Favorites</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="text-muted-foreground hover:text-accent-foreground"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-accent-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1.5">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} className="ml-2 rounded-full px-6">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ padding: 'clamp(3rem,8vw,6rem) 0 clamp(2rem,5vw,4rem)' }}>
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="animate-fade-up">
            <span className="eyebrow mb-6 flex items-center justify-center gap-2">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span className="opacity-80">AI-Powered Skincare</span>
            </span>
          </div>

          <h1
            className="font-display text-foreground leading-[1.05] mt-6 animate-fade-up"
            style={{
              animationDelay: '0.1s',
              fontWeight: 300,
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              letterSpacing: '-0.01em',
            }}
          >
            Skincare made <em className="italic" style={{ color: 'hsl(var(--skinwise-terracotta))' }}>personal</em>,
            <br />made precise.
          </h1>

          <p
            className="text-muted-foreground mx-auto mt-6 animate-fade-up font-body"
            style={{
              animationDelay: '0.2s',
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              fontWeight: 300,
              maxWidth: '48ch',
              lineHeight: 1.7,
            }}
          >
            SkinWise analyses your unique skin profile using AI-powered intelligence to recommend
            products that genuinely work — not guesswork, not generic advice.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate(user ? '/quiz' : '/auth')}
              className="text-base px-8 rounded-full shadow-warm hover:shadow-warm transition-shadow"
            >
              {user ? 'Take the Skin Survey' : 'Get Started'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            {user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/history')}
                className="text-base px-8 rounded-full border-skinwise-terracotta/30 text-skinwise-terracotta hover:bg-skinwise-terracotta/5 hover:text-skinwise-terracotta"
              >
                View Past Results
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Strip — reference style: parchment background, inline stats, no pills */}
      <div
        style={{
          background: 'hsl(var(--muted))',
          borderTop: '1px solid hsl(var(--border) / 0.5)',
          borderBottom: '1px solid hsl(var(--border) / 0.5)',
          padding: 'clamp(1.5rem,3vw,2.5rem) 0',
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            {[
              ['95%', 'Recommendation Accuracy'],
              ['500+', 'Skincare Products Mapped'],
              ['15', 'Skin Conditions Detected'],
              ['2 min', 'Average Analysis Time'],
            ].map(([num, label]) => (
              <div key={label} className="animate-fade-up">
                <div
                  className="font-display"
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                    fontWeight: 300,
                    color: 'hsl(var(--skinwise-terracotta))',
                    lineHeight: 1,
                    marginBottom: '0.5rem',
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase' as const,
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section — reference style: parchment bg, centered items, round icon holders */}
      <section
        style={{
          padding: 'clamp(2.5rem,5vw,4rem) 0',
          background: 'hsl(var(--muted))',
          borderBottom: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
              textAlign: 'center',
            }}
          >
            {[
              {
                icon: '🔬',
                title: 'Smart Skin Analysis',
                desc: 'Our computer vision model detects skin type and conditions, giving precise inputs for the recommendation engine.',
              },
              {
                icon: '🎯',
                title: 'Personalised Picks',
                desc: 'Machine learning maps your unique profile to a curated list of products — tailored to your concerns, not a generic skin type.',
              },
              {
                icon: '🔄',
                title: 'Continuous Learning',
                desc: 'Your feedback refines the model over time. The more you use SkinWise, the more accurate your recommendations become.',
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '9999px',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    boxShadow: '0 1px 3px rgba(46,37,32,0.07)',
                  }}
                >
                  {f.icon}
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 400,
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {f.title}
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted-foreground))',
                    maxWidth: '22ch',
                    margin: '0 auto',
                    lineHeight: 1.5,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section — reference style: bark background, full-width, display font */}
      <section
        style={{
          padding: 'clamp(3rem,6vw,6rem) 0',
          background: 'hsl(var(--skinwise-bark))',
          textAlign: 'center' as const,
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          <h2
            className="font-display"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 300,
              color: 'hsl(var(--skinwise-cream))',
              marginBottom: '1rem',
            }}
          >
            Ready to meet your <em className="italic" style={{ color: 'hsl(var(--skinwise-terracotta))' }}>best skin</em>?
          </h2>
          <p
            className="font-body"
            style={{
              fontSize: '1rem',
              color: 'hsl(var(--skinwise-cream) / 0.7)',
              maxWidth: '44ch',
              margin: '0 auto 2rem',
            }}
          >
            Join thousands who've discovered their perfect routine with SkinWise.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? '/quiz' : '/auth')}
            className="text-base px-8 rounded-full"
            style={{
              background: 'hsl(var(--skinwise-sage))',
              color: '#fff',
            }}
          >
            Start Your Analysis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center' as const,
          padding: '2rem',
          borderTop: '1px solid hsl(var(--border) / 0.5)',
          fontSize: '0.875rem',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        © 2026 SkinWise — AI-powered Skin Analysis and Product Recommendations.
        <p className="mt-2 text-xs opacity-70">
          Disclaimer: Recommendations are ML-generated. Consult a dermatologist for medical advice.
        </p>
      </footer>
    </div>
  );
}
