import Link from "next/link";
import { HelpCircle, MessageSquare, Shield, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    q: "How do I buy data bundles?",
    a: "Browse shops on the marketplace, pick your network (MTN, Telecel, AirtelTigo), choose your GB size, enter your phone number, and pay from your wallet."
  },
  {
    q: "When do I send MoMo proof?",
    a: "Payment is taken from your wallet at checkout. After that, open the order chat and upload your Mobile Money screenshot so the seller can verify and fulfill."
  },
  {
    q: "How do shop owners get paid?",
    a: "Order value minus a 3% platform commission is credited when you mark orders completed. Withdraw to MoMo from your wallet."
  },
  {
    q: "What if something goes wrong?",
    a: "Open a dispute from your order page or message the shop. Platform admins can review disputed orders."
  }
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand">
          <HelpCircle className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold">Help centre</h1>
        <p className="mt-2 text-muted-foreground">
          Quick answers for buyers and sellers on BundleHub Ghana
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Zap, title: "Fast delivery", text: "Most data orders complete within minutes." },
          { icon: Shield, title: "Verified shops", text: "Sellers are reviewed before going live." },
          { icon: Wallet, title: "Wallet checkout", text: "Pay securely, then share MoMo proof in chat." }
        ].map((item) => (
          <Card key={item.title} className="border-0 shadow-card dark:shadow-card-dark">
            <CardContent className="p-5 text-center">
              <item.icon className="mx-auto h-8 w-8 text-mtn" />
              <p className="mt-3 font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="font-display text-xl font-semibold">Frequently asked questions</h2>
        {faqs.map((f) => (
          <Card key={f.q} className="border-0 shadow-card dark:shadow-card-dark">
            <CardContent className="p-5">
              <p className="font-medium">{f.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10 border-0 gradient-brand text-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">Still need help?</p>
            <p className="text-sm text-white/85">
              Sign in and message your shop from any order thread.
            </p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/auth/login">
              <MessageSquare className="mr-2 h-4 w-4" />
              Sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
