import {
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/components';

export default function ContactPage() {
  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle>Contact Sales</CardTitle>
          <CardDescription>
            School and district pricing is custom. Reach out and we’ll help you plan a rollout.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 text-sm text-[hsl(var(--muted-fg))]">
            For now, use a simple email contact. Later we can add a real form + CRM hook.
          </div>

          <Button
            href="mailto:learnmetrics@example.com?subject=LearnMetrics%20School%20Plan"
            size="lg"
            className="w-full"
          >
            Email Sales
          </Button>

          <Button href="/#pricing" variant="outline" size="lg" className="w-full">
            Back to pricing
          </Button>
        </CardContent>
      </Card>
    </Section>
  );
}
