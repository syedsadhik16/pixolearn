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
    question: 'How does the 1-day free trial work?',
    answer:
      'The free trial gives your child 24 hours of full premium access — all lessons, AI practice, and features are unlocked. No payment is required. After 24 hours, the account reverts to the free plan automatically.',
  },
  {
    question: 'Can I switch between levels?',
    answer:
      'Each level is a structured curriculum designed to build on the previous one. We recommend starting with the level that matches your child\'s current ability. Our initial assessment helps determine the right starting point.',
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
    question: 'Is there a money-back guarantee?',
    answer:
      'Yes! We offer a 30-day money-back guarantee on all plans. If you\'re not satisfied with your child\'s progress, contact us for a full refund — no questions asked.',
  },
  {
    question: 'What makes PIXO different from other apps?',
    answer:
      'PIXO uses AI-powered speech evaluation to give real-time pronunciation feedback, gamified learning with rewards and streaks, and a structured curriculum designed by language experts — not just random exercises.',
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
