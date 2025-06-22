import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status:
    | "Disponible"
    | "Prestado"
    | "Mantenimiento"
    | "Retirado"
    | "Asignado"
    | "Pendiente"
    | "Aprobada"
    | "Rechazada"
    | "CARGA"
    | "RETIRO"
    | "Finalizada"
    | "Cancelada"
    | "PENDIENTE_DE_RETIRO"
    | "Vencido"
    | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let className = ""

  switch (status) {
    case "Disponible":
      className = "bg-status-available text-status-available-foreground hover:bg-status-available/80"
      break
    case "Prestado":
      className = "bg-status-lent text-status-lent-foreground hover:bg-status-lent/80"
      break
    case "Mantenimiento":
      className = "bg-status-maintenance text-status-maintenance-foreground hover:bg-status-maintenance/80"
      break
    case "Retirado":
    case "Vencido":
      className = "bg-status-retired text-status-retired-foreground hover:bg-status-retired/80"
      break
    case "Asignado":
      className = "bg-status-assigned text-status-assigned-foreground hover:bg-status-assigned/80"
      break
    case "PENDIENTE_DE_RETIRO":
    case "Pendiente":
      className = "bg-status-pending-retire text-status-pending-retire-foreground hover:bg-status-pending-retire/80"
      break
    case "Aprobada":
    case "Finalizada":
      className = "bg-status-available text-status-available-foreground hover:bg-status-available/80"
      break
    case "Rechazada":
    case "Cancelada":
      className = "bg-status-retired text-status-retired-foreground hover:bg-status-retired/80"
      break
    case "CARGA":
      className = "bg-status-maintenance text-status-maintenance-foreground hover:bg-status-maintenance/80"
      break
    case "RETIRO":
      className = "bg-status-retired text-status-retired-foreground hover:bg-status-retired/80"
      break
    default:
      className = "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      break
  }

  return (
    <Badge variant="default" className={cn("px-2 py-0.5 text-xs font-medium", className)}>
      {status}
    </Badge>
  )
}
