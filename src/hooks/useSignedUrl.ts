import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate signed URLs for private storage bucket files
 * @param filePath - The file path or full URL stored in the database
 * @param bucket - The storage bucket name (default: 'signatures')
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export function useSignedUrl(
  filePath: string | null | undefined,
  bucket: string = "signatures",
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract just the filename from full URL if needed
        const fileName = extractFileName(filePath, bucket);
        
        if (!fileName) {
          // If we can't extract a filename, it might be a base64 data URL or other format
          // In that case, just use the original value
          setSignedUrl(filePath);
          setLoading(false);
          return;
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(fileName, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        console.error("Failed to generate signed URL:", err);
        setError(err instanceof Error ? err : new Error("Failed to generate signed URL"));
        // Fallback to original URL in case of error
        setSignedUrl(filePath);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [filePath, bucket, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Extract filename from full URL or path
 */
function extractFileName(urlOrPath: string, bucket: string): string | null {
  // Check if it's a data URL (base64)
  if (urlOrPath.startsWith("data:")) {
    return null;
  }

  // Check if it's already just a filename (no slashes or URL structure)
  if (!urlOrPath.includes("/") && !urlOrPath.includes("http")) {
    return urlOrPath;
  }

  try {
    // Try to parse as URL
    const url = new URL(urlOrPath);
    
    // Extract path after bucket name
    // URL format: https://xxx.supabase.co/storage/v1/object/public/signatures/filename.png
    // or: https://xxx.supabase.co/storage/v1/object/sign/signatures/filename.png?token=xxx
    const pathMatch = url.pathname.match(new RegExp(`/${bucket}/(.+?)(?:\\?|$)`));
    if (pathMatch) {
      return decodeURIComponent(pathMatch[1]);
    }

    // Alternative: just get the last part of the path
    const pathParts = url.pathname.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes(".")) {
      return decodeURIComponent(lastPart);
    }
  } catch {
    // Not a valid URL, might be just a path
    // Try to extract filename from path
    const pathParts = urlOrPath.split("/");
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.includes(".")) {
      return lastPart;
    }
  }

  // Return the original if we can't parse it
  return urlOrPath;
}

/**
 * Utility function to generate a signed URL for a single file
 * (for use outside of React components, e.g., in PDF generation)
 */
export async function getSignedUrl(
  filePath: string | null | undefined,
  bucket: string = "signatures",
  expiresIn: number = 3600
): Promise<string | null> {
  if (!filePath) return null;

  // Check if it's a data URL
  if (filePath.startsWith("data:")) {
    return filePath;
  }

  const fileName = extractFileName(filePath, bucket);
  if (!fileName) return filePath;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    console.error("Failed to generate signed URL:", err);
    return filePath; // Fallback to original
  }
}
