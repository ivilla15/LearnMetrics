import { Section, Card, CardHeader, CardTitle, CardContent, Button } from '@/components';

export default function BillingCancelPage() {
  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-[hsl(var(--muted-fg))]">
            No charges were made. You can upgrade to Pro anytime.
          </p>

          <div className="flex flex-row items-center justify-center gap-2">
            <Button href="/api/billing/checkout?plan=pro" variant="primary">
              Try again
            </Button>

            <Button href="/teacher/classrooms" variant="secondary">
              Back to dashboard
            </Button>

            <Button href="/#pricing" variant="secondary">
              View Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
