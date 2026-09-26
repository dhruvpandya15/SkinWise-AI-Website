import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import FaceCapture from '@/components/FaceCapture';
import { BrandLogo } from '@/components/BrandLogo';

export default function FaceCapturePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleValidCapture = (base64Image: string) => {
    // TODO: send base64Image to your backend for skin analysis
    toast({
      title: 'Photo captured',
      description: 'Checks passed — sending photo for analysis.',
    });
    console.log('Captured image length:', base64Image.length);
  };

  return (
    <div className="min-h-screen gradient-skinwise-subtle py-8 px-4 relative texture-grain">
      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-center mb-10 cursor-pointer" onClick={() => navigate('/')}>
          <BrandLogo className="h-10 w-auto" />
        </div>
        <FaceCapture
          onValidCapture={handleValidCapture}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
