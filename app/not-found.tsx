// Se muestra para URLs que no existen y cuando una página llama a notFound().
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 px-4 py-12">
      <h1 className="text-2xl font-semibold">No encontramos esta página</h1>
      <p className="text-muted-foreground">
        Revisa que la dirección esté bien escrita.
      </p>
    </main>
  );
}
