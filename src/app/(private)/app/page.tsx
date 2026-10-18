export default function AppPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to App Page
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          This is the app page.
        </p>
      </section>
    </main>
  );
}
