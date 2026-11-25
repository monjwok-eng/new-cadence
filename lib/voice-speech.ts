export interface VoiceSpeechProfile {
  langPrefixes: string[];
  preferredNames: string[];
  pitch: number;
  rate: number;
}

const VOICE_SPEECH_MAP: Record<string, VoiceSpeechProfile> = {
  voice_aria: {
    langPrefixes: ['en-US', 'en'],
    preferredNames: ['aria', 'samantha', 'victoria', 'karen', 'zira', 'google us english', 'female'],
    pitch: 1.06,
    rate: 1.02,
  },
  voice_marcus: {
    langPrefixes: ['en-US', 'en'],
    preferredNames: ['alex', 'daniel', 'david', 'mark', 'guy', 'aaron', 'male'],
    pitch: 0.9,
    rate: 0.96,
  },
  voice_clara: {
    langPrefixes: ['en-GB', 'en'],
    preferredNames: ['serena', 'kate', 'libby', 'sonia', 'google uk english female', 'female'],
    pitch: 1.04,
    rate: 1.0,
  },
  voice_mateo: {
    langPrefixes: ['es', 'en-US', 'en'],
    preferredNames: ['mateo', 'jorge', 'diego', 'paul', 'carlos', 'male'],
    pitch: 0.96,
    rate: 1.05,
  },
  voice_noah: {
    langPrefixes: ['en-AU', 'en-GB', 'en'],
    preferredNames: ['lee', 'gordon', 'william', 'oliver', 'james', 'male'],
    pitch: 0.94,
    rate: 1.0,
  },
  voice_sora: {
    langPrefixes: ['en-US', 'en'],
    preferredNames: ['ava', 'allison', 'jenny', 'nova', 'google us english'],
    pitch: 1.0,
    rate: 1.03,
  },
};

export function pickBrowserVoice(
  voices: SpeechSynthesisVoice[],
  voiceId?: string,
  language?: string
): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number; lang: string } {
  const profile =
    (voiceId && VOICE_SPEECH_MAP[voiceId]) || VOICE_SPEECH_MAP.voice_aria;

  const langHint =
    language?.toLowerCase().includes('spanish')
      ? 'es-ES'
      : language?.toLowerCase().includes('uk')
        ? 'en-GB'
        : language?.toLowerCase().includes('au')
          ? 'en-AU'
          : profile.langPrefixes[0] || 'en-US';

  if (!voices || voices.length === 0) {
    return {
      voice: null,
      pitch: profile.pitch,
      rate: profile.rate,
      lang: langHint,
    };
  }

  for (const nameHint of profile.preferredNames) {
    const match = voices.find((v) => {
      const n = v.name.toLowerCase();
      const l = v.lang.toLowerCase();
      const langOk = profile.langPrefixes.some((p) => l.startsWith(p.toLowerCase()));
      return langOk && n.includes(nameHint);
    });
    if (match) {
      return {
        voice: match,
        pitch: profile.pitch,
        rate: profile.rate,
        lang: match.lang || langHint,
      };
    }
  }

  const langMatch = voices.find((v) =>
    profile.langPrefixes.some((p) =>
      v.lang.toLowerCase().startsWith(p.toLowerCase())
    )
  );

  return {
    voice: langMatch || voices[0] || null,
    pitch: profile.pitch,
    rate: profile.rate,
    lang: langMatch?.lang || langHint,
  };
}
