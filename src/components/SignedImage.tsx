import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Skeleton } from "@/components/ui/skeleton";

interface SignedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  bucket?: string;
  expiresIn?: number;
}

/**
 * Component that displays an image from a private storage bucket
 * Automatically generates signed URLs for secure access
 */
export function SignedImage({
  src,
  alt,
  className = "",
  bucket = "signatures",
  expiresIn = 3600,
}: SignedImageProps) {
  const { signedUrl, loading, error } = useSignedUrl(src, bucket, expiresIn);

  if (!src) return null;

  if (loading) {
    return <Skeleton className={`${className} min-h-[96px]`} />;
  }

  if (error || !signedUrl) {
    return (
      <div className={`${className} flex items-center justify-center text-muted-foreground text-sm`}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
    />
  );
}
