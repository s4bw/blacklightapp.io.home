import { BusinessProfileForm } from "@/app/join/business-profile-form";

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-[hsl(276.96,80.65%,30.39%)] py-10">
      <div className="mx-auto w-full max-w-4xl px-4">
        <BusinessProfileForm />
      </div>
    </main>
  );
}
