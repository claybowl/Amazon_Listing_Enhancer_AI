"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageGenerationNoticeProps {
  provider: string
  isPlaceholder?: boolean
  onSwitchProvider?: (provider: string) => void
}

export function ImageGenerationNotice({
  provider,
  isPlaceholder = false,
  onSwitchProvider,
}: ImageGenerationNoticeProps) {
  if (!isPlaceholder) return null

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="space-y-2">
          <p>
            <strong>Note:</strong> Gemini doesn't currently support direct image generation. Placeholder images are
            being shown based on enhanced descriptions.
          </p>
          <p className="text-sm">For actual AI-generated images, try these alternatives:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => onSwitchProvider?.("openai")} className="text-xs">
              OpenAI DALL-E 3
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSwitchProvider?.("stability")} className="text-xs">
              Stability AI
            </Button>
            <Button size="sm" variant="outline" onClick={() => onSwitchProvider?.("replicate")} className="text-xs">
              Replicate
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
