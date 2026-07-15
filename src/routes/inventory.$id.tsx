import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory/$id')({
  component: InventoryItem,
})

function InventoryItem() {
  const { id } = Route.useParams()
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Inventory Item Details</h2>
      <p>Viewing details for product ID: {id}</p>
    </div>
  )
}
