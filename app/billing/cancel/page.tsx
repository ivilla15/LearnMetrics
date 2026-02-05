// app/billing/cancel/page.tsx
import {
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/components';

export default function BillingCancelPage() {
  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-4xl shadow-sm">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription>
            No worries — you were not charged. You can try again anytime.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-3">
          <Button href="/api/billing/checkout?plan=pro" variant="primary">
            Try again
          </Button>

          <Button href="/teacher/classrooms" variant="secondary">
            Back to dashboard
          </Button>

          <Button href="/#pricing" variant="ghost">
            View pricing
          </Button>
        </CardContent>
      </Card>
    </Section>
  );
}
