'use client';

import * as React from 'react';
import { MessageCircle, Send } from 'lucide-react';

import {
  useToast,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Button,
  Label,
} from '@/components';
import { Textarea } from '@/components/TextArea';
import { sendContact } from './actions/sendContact';

export default function ContactForm() {
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setBusy(true);
      await sendContact(formData);

      toast('Message sent. Thanks for reaching out.', 'success');
      form.reset();
    } catch {
      toast('Something went wrong. Please try again later.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-0 rounded-none bg-transparent shadow-none">
      <CardHeader className="p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-2xl">Send a message</CardTitle>
            <p className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
              We usually respond within 1 business day.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-10 sm:px-10">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Honeypot anti-spam */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={6} required />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={busy} variant="primary">
            <Send className="mr-2 h-5 w-5" aria-hidden="true" />
            {busy ? 'Sending…' : 'Send message'}
          </Button>

          <p className="text-xs text-[hsl(var(--muted-fg))]">
            By sending this form, you agree to be contacted about your request.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
