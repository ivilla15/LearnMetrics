import { Section, Card, CardContent } from '@/components';
import ContactForm from '@/modules/marketing/components/forms/ContactForm';
import { Coffee, Github, Linkedin, Mail } from 'lucide-react';
import { PageTopBar } from '@/components/PageTopBar';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  return (
    <main className="bg-[hsl(var(--bg))]">
      <PageTopBar variant="surface" />
      <Section className="scroll-mt-32">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="mb-10 text-center md:mb-14">
            <h1 className="text-4xl font-semibold tracking-tight text-[hsl(var(--fg))] sm:text-5xl">
              Contact
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--muted-fg))] sm:text-base">
              Questions, feedback, or partnership ideas. Send a message and we’ll reply soon.
            </p>
          </div>

          {/* Container */}
          <div className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="grid lg:grid-cols-2">
              {/* Left: Form */}
              <div className="border-b border-[hsl(var(--border))] lg:border-b-0 lg:border-r">
                <ContactForm />
              </div>

              {/* Right: Info */}
              <div className="bg-[hsl(var(--brand)/0.10)]">
                <Card className="h-full border-0 bg-transparent shadow-none rounded-none">
                  <CardContent className="flex h-full flex-col justify-center p-8 sm:p-10">
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-semibold text-[hsl(var(--fg))]">
                          Get in touch
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-fg))]">
                          We’re happy to help with onboarding, billing questions, or product
                          feedback.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <a
                          href="mailto:ivilla.devcs@gmail.com"
                          className="group flex items-center gap-4 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 transition-colors hover:bg-[hsl(var(--brand)/0.06)]"
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                            <Mail className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Email</div>
                            <div className="truncate text-sm text-[hsl(var(--muted-fg))]">
                              ivilla.devcs@gmail.com
                            </div>
                          </div>
                        </a>

                        <a
                          href="https://github.com/ivilla15"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 transition-colors hover:bg-[hsl(var(--brand)/0.06)]"
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                            <Github className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                              GitHub
                            </div>
                            <div className="truncate text-sm text-[hsl(var(--muted-fg))]">
                              github.com/ivilla15
                            </div>
                          </div>
                        </a>

                        <a
                          href="https://www.linkedin.com/in/isaiah-villalobos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 transition-colors hover:bg-[hsl(var(--brand)/0.06)]"
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                            <Linkedin className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                              LinkedIn
                            </div>
                            <div className="truncate text-sm text-[hsl(var(--muted-fg))]">
                              linkedin.com/in/isaiah-villalobos
                            </div>
                          </div>
                        </a>
                      </div>

                      <div className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[14px] bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                            <Coffee className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                            Coffee chat
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-fg))]">
                          Want to talk product, accessibility, or implementation details. Send a
                          note and we’ll coordinate.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </Section>
      <Footer variant="brand-soft" />
    </main>
  );
}
