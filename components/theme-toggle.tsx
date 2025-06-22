"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useApp } from "@/contexts/app-context"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { updateUserTheme } = useApp()

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === "light" || newTheme === "dark") {
      setTheme(newTheme)
      updateUserTheme(newTheme)
    }
  }

  return (
    <TooltipProvider>
      <ToggleGroup type="single" value={theme} onValueChange={handleThemeChange} aria-label="Seleccionar tema">
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="light"
              aria-label="Tema claro"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-muted" // Improved hover/active
            >
              <Sun className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Tema claro</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Tema claro</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="dark"
              aria-label="Tema oscuro"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-muted" // Improved hover/active
            >
              <Moon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Tema oscuro</span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Tema oscuro</TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  )
}
