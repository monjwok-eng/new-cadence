import React from 'react';
import {
  SiCaldotcom,
  SiCalendly,
  SiGoogle,
  SiHubspot,
  SiInstagram,
  SiIntercom,
  SiMessenger,
  SiOdoo,
  SiReddit,
  SiShopify,
  SiStripe,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiZendesk,
  SiZoho,
} from 'react-icons/si';
import { FaLinkedin, FaSalesforce, FaSlack } from 'react-icons/fa6';
import { RiOpenaiFill } from 'react-icons/ri';
import {
  Building2,
  Globe,
  GraduationCap,
  Headphones,
  LayoutTemplate,
  LifeBuoy,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Store,
  Sun,
  Users,
} from 'lucide-react';
import { BrandMark } from '@/components/ui/brand-loader';

export interface ChipOption {
  id: string;
  label: string;
  renderIcon?: () => React.ReactNode;
}

export const REFERRAL_OPTIONS: ChipOption[] = [
  {
    id: 'google',
    label: 'Google search',
    renderIcon: () => <SiGoogle className="h-4 w-4 text-[#4285F4]" />,
  },
  {
    id: 'ai',
    label: 'ChatGPT / Claude / other AI',
    renderIcon: () => <RiOpenaiFill className="h-4 w-4 text-neutral-900" />,
  },
  {
    id: 'friend',
    label: 'Friend or colleague',
    renderIcon: () => <Users className="h-4 w-4 text-neutral-700" />,
  },
  {
    id: 'website',
    label: 'Another website using Cadence',
    renderIcon: () => <BrandMark className="h-4 w-4 text-neutral-900" />,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    renderIcon: () => <FaLinkedin className="h-4 w-4 text-[#0A66C2]" />,
  },
  {
    id: 'x',
    label: 'X',
    renderIcon: () => <SiX className="h-3.5 w-3.5 text-neutral-900" />,
  },
  {
    id: 'reddit',
    label: 'Reddit',
    renderIcon: () => <SiReddit className="h-4 w-4 text-[#FF4500]" />,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    renderIcon: () => <SiYoutube className="h-4 w-4 text-[#FF0000]" />,
  },
  {
    id: 'course',
    label: 'Course or training',
    renderIcon: () => <GraduationCap className="h-4 w-4 text-neutral-700" />,
  },
  {
    id: 'other',
    label: 'Other',
    renderIcon: () => <MoreHorizontal className="h-4 w-4 text-neutral-600" />,
  },
];

export const COMPANY_SIZE_OPTIONS: ChipOption[] = [
  {
    id: 'startup',
    label: 'Startup (1-9)',
    renderIcon: () => <Users className="h-4 w-4 text-neutral-700" />,
  },
  {
    id: 'small',
    label: 'Small business (10-49)',
    renderIcon: () => <Building2 className="h-4 w-4 text-neutral-700" />,
  },
  {
    id: 'mid',
    label: 'Mid-market (50–499)',
    renderIcon: () => <Building2 className="h-4 w-4 text-neutral-800" />,
  },
  {
    id: 'enterprise',
    label: 'Enterprise (500+)',
    renderIcon: () => <Globe className="h-4 w-4 text-neutral-900" />,
  },
];

export const ROLE_PRESETS: {
  id: string;
  label: string;
  instructions: string;
}[] = [
  {
    id: 'Customer support',
    label: 'Customer support',
    instructions:
      'Answer customer questions clearly and concisely. Stay polite and professional. Escalate billing or account issues to a human agent when unsure.',
  },
  {
    id: 'Sales & Lead Gen',
    label: 'Sales & Lead Gen',
    instructions:
      'Greet visitors warmly, answer product and pricing questions from our knowledge base, and capture their name and email to schedule a tailored demo.',
  },
  {
    id: 'Appointment Booking',
    label: 'Appointment Booking',
    instructions:
      'Help visitors find available time slots, clarify service details, and collect their contact information to confirm appointments smoothly.',
  },
  {
    id: 'Technical Specialist',
    label: 'Technical Specialist',
    instructions:
      'Provide step-by-step troubleshooting grounded strictly in our documentation. Never guess API syntax or account policies when uncertain.',
  },
];

export const ACTION_STACK_OPTIONS: ChipOption[] = [
  {
    id: 'stripe',
    label: 'Stripe',
    renderIcon: () => <SiStripe className="h-4 w-4 text-[#635BFF]" />,
  },
  {
    id: 'shopify',
    label: 'Shopify',
    renderIcon: () => <SiShopify className="h-4 w-4 text-[#95BF47]" />,
  },
  {
    id: 'cal',
    label: 'Cal',
    renderIcon: () => <SiCaldotcom className="h-4 w-4 text-neutral-900" />,
  },
  {
    id: 'calendly',
    label: 'Calendly',
    renderIcon: () => <SiCalendly className="h-4 w-4 text-[#006BFF]" />,
  },
  {
    id: 'slack',
    label: 'Slack',
    renderIcon: () => <FaSlack className="h-4 w-4 text-[#4A154B]" />,
  },
  {
    id: 'twilio',
    label: 'Twilio',
    renderIcon: () => <PhoneCall className="h-4 w-4 text-[#F22F46]" />,
  },
];

export const HELPDESK_STACK_OPTIONS: ChipOption[] = [
  {
    id: 'cadence',
    label: 'Cadence',
    renderIcon: () => <BrandMark className="h-4 w-4 text-neutral-900" />,
  },
  {
    id: 'zendesk',
    label: 'Zendesk',
    renderIcon: () => <SiZendesk className="h-4 w-4 text-[#03363D]" />,
  },
  {
    id: 'sunshine',
    label: 'Sunshine',
    renderIcon: () => <Sun className="h-4 w-4 text-[#F59E0B]" />,
  },
  {
    id: 'salesforce',
    label: 'Salesforce',
    renderIcon: () => <FaSalesforce className="h-4 w-4 text-[#00A1E0]" />,
  },
  {
    id: 'intercom',
    label: 'Intercom',
    renderIcon: () => <SiIntercom className="h-4 w-4 text-[#1F8DED]" />,
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    renderIcon: () => <SiHubspot className="h-4 w-4 text-[#FF7A59]" />,
  },
  {
    id: 'freshdesk',
    label: 'Freshdesk',
    renderIcon: () => <Headphones className="h-4 w-4 text-[#25C16F]" />,
  },
  {
    id: 'freshchat',
    label: 'Freshchat',
    renderIcon: () => <MessageSquare className="h-4 w-4 text-[#45A4EC]" />,
  },
  {
    id: 'zoho-desk',
    label: 'Zoho Desk',
    renderIcon: () => <SiZoho className="h-4 w-4 text-[#0A9849]" />,
  },
  {
    id: 'helpscout',
    label: 'Help Scout',
    renderIcon: () => <LifeBuoy className="h-4 w-4 text-[#1292EE]" />,
  },
  {
    id: 'gorgias',
    label: 'Gorgias',
    renderIcon: () => <Store className="h-4 w-4 text-neutral-900" />,
  },
  {
    id: 'odoo',
    label: 'Odoo',
    renderIcon: () => <SiOdoo className="h-4 w-4 text-[#714B67]" />,
  },
];

export const DEPLOY_CHANNEL_OPTIONS: ChipOption[] = [
  {
    id: 'chat-bubble',
    label: 'Chat Bubble',
    renderIcon: () => <MessageCircle className="h-4 w-4 text-neutral-800" />,
  },
  {
    id: 'agent-page',
    label: 'Agent page',
    renderIcon: () => <LayoutTemplate className="h-4 w-4 text-neutral-800" />,
  },
  {
    id: 'center-stage',
    label: 'Center Stage',
    renderIcon: () => <Maximize2 className="h-4 w-4 text-neutral-800" />,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    renderIcon: () => <SiWhatsapp className="h-4 w-4 text-[#25D366]" />,
  },
  {
    id: 'messenger',
    label: 'Messenger',
    renderIcon: () => <SiMessenger className="h-4 w-4 text-[#0084FF]" />,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    renderIcon: () => <SiInstagram className="h-4 w-4 text-[#E4405F]" />,
  },
  {
    id: 'shopify',
    label: 'Shopify',
    renderIcon: () => <SiShopify className="h-4 w-4 text-[#95BF47]" />,
  },
  {
    id: 'email',
    label: 'Email',
    renderIcon: () => <Mail className="h-4 w-4 text-rose-500" />,
  },
  {
    id: 'slack',
    label: 'Slack',
    renderIcon: () => <FaSlack className="h-4 w-4 text-[#4A154B]" />,
  },
  {
    id: 'zendesk',
    label: 'Zendesk',
    renderIcon: () => <SiZendesk className="h-4 w-4 text-[#03363D]" />,
  },
  {
    id: 'salesforce',
    label: 'Salesforce',
    renderIcon: () => <FaSalesforce className="h-4 w-4 text-[#00A1E0]" />,
  },
  {
    id: 'phone',
    label: 'Phone',
    renderIcon: () => <Phone className="h-4 w-4 text-emerald-600" />,
  },
];
