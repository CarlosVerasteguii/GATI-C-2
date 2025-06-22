import type React from "react"
import AppLayout from "@/components/app-layout" // Importa AppLayout como default export

export default function AppGroupedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* DEBUG: Si ves este texto en la esquina superior izquierda, el layout del grupo se está aplicando. */}
      {/* Si NO lo ves en /asignados, /tareas-pendientes, /configuracion, el problema es la ruta. */}
      {/* <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999 }}>DEBUG: App Layout Group Applied</div> */}
      <AppLayout>{children}</AppLayout>
    </>
  )
}
