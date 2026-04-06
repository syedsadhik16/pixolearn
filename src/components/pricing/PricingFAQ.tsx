import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What age group is PIXO designed for?',
    answer:
      'PIXO is designed for children aged 4–12 who are learning to read and speak English. The curriculum adapts to your child\'s current level, starting from basic phonics all the way to fluent storytelling.',
  },
  {
    question: 'How does the Freemium access work?',
    answer:
      'Freemium access gives your child 24 hours of full access — all lessons, AI practice, and features are unlocked. No payment is required. After 24 hours, you can upgrade to Premium to continue learning.',
  },
  {
    question: 'Can I choose my child\'s level manually?',
    answer:
      'Absolutely! You can choose your child\'s level manually or follow PIXO\'s recommended level based on the assessment. The recommendation is there to guide you, but the final choice is always yours.',
  },
  {
    question: 'How much time should my child spend daily?',
    answer:
      'We recommend 15–20 minutes of daily practice for the best results. Consistency matters more than duration — even 10 minutes a day builds strong habits and steady progress.',
  },
  {
    question: 'How do I track my child\'s progress?',
    answer:
      'Parents get a dedicated dashboard with detailed progress reports, pronunciation scores, streak tracking, and weekly summaries. You\'ll also receive notifications when your child completes lessons or hits milestones.',
  },
  {
    question: 'Does PIXO have audio support for young learners?',
    answer:
      'Yes! Every lesson, question, and instruction can be listened to aloud. Children can tap the speaker icon to hear questions and answer options read out, making the experience accessible for early readers.',
  },
  {
    question: 'What makes PIXO different from other apps?',
    answer:
      'PIXO uses AI-powered speech evaluation to give real-time pronunciation feedback, gamified learning with rewards and streaks, audio-assisted learning, and a structured curriculum designed by language experts — not just random exercises.',
  },
];

export function PricingFAQ() {
  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-2">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Everything parents want to know
        </p>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
