"use client"

import { DesignerItem } from "@/types"
import { SKILL_LABELS, ALL_SKILL_KEYS, tierLabel } from "@/components/coaching/lib/skills"
import { DREYFUS_DESCRIPTIONS, DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"
import { SplitButton } from "@/components/claude/SplitButton"

interface Props {
  designer: DesignerItem
  onOpenClaude: (prompt: string, label: string) => void
}

export function CoachingBrief({ designer, onOpenClaude }: Props) {
  function buildSkillMap(): Record<string, number> {
    const map: Record<string, number> = {}
    ALL_SKILL_KEYS.forEach((k) => { map[k] = 0 })
    designer.skills.forEach((s) => { map[s.skillName] = s.value })
    return map
  }

  function buildBriefPrompt(): string {
    const skillMap = buildSkillMap()
    const stageLabel = designer.dreyfusStage ? DREYFUS_LABELS[designer.dreyfusStage] : "Not set"
    const stageDesc = designer.dreyfusStage ? DREYFUS_DESCRIPTIONS[designer.dreyfusStage] : "No stage set"

    const skillLines = ALL_SKILL_KEYS.map((k) => {
      const v = skillMap[k]
      return `${SKILL_LABELS[k]}: ${v}/9 (${tierLabel(v)})`
    }).join("\n")

    const activeGoals = designer.goals.filter((g) => g.status !== "COMPLETE")
    const goalLines = activeGoals.length
      ? activeGoals.map((g) =>
          `- ${g.title} (${g.status}): meets=${g.meetsCriteria ?? "—"}, exceeds=${g.exceedsCriteria ?? "—"}, timeline=${g.timeline}`
        ).join("\n")
      : "No active goals."

    const recentSessions = designer.sessions.slice(0, 3)
    const sessionLines = recentSessions.length
      ? recentSessions.map((s) => `${s.date} [${s.flag ?? "no flag"}]: ${s.notes}`).join("\n")
      : "No sessions recorded."

    const feedbackLines = designer.feedback.length
      ? designer.feedback.map((f) => `${f.sourceName} (${f.date}): ${f.body}`).join("\n")
      : "No stakeholder feedback."

    return `Designer: ${designer.name}, ${designer.role}, ${designer.roleLevel}
Dreyfus Stage: ${stageLabel} — ${stageDesc}

Skills:
${skillLines}

Active Goals:
${goalLines}

Recent Sessions (last 3):
${sessionLines}

Stakeholder Feedback:
${feedbackLines}

Please provide personalized coaching guidance for ${designer.name} framed specifically for a ${stageLabel} designer. Focus on: ${stageDesc}`
  }

  function buildQuestionsPrompt(): string {
    const stageLabel = designer.dreyfusStage ? DREYFUS_LABELS[designer.dreyfusStage] : "Not set"
    const stageDesc = designer.dreyfusStage ? DREYFUS_DESCRIPTIONS[designer.dreyfusStage] : "No stage set"

    const openTopics = designer.topics.filter((t) => !t.discussed)
    const topicList = openTopics.length
      ? openTopics.map((t) => `- ${t.title}`).join("\n")
      : "No open topics."

    const recentSessions = designer.sessions.slice(0, 3)
    const sessionThemes = recentSessions.length
      ? recentSessions.map((s) => `${s.date} [${s.flag ?? "no flag"}]: ${s.notes}`).join("\n")
      : "No recent sessions."

    return `Designer: ${designer.name}, ${designer.role} (${designer.roleLevel})
Dreyfus Stage: ${stageLabel} — ${stageDesc}

Open 1:1 Topics:
${topicList}

Recent Session Themes:
${sessionThemes}

Please generate 6 tailored 1:1 coaching questions for ${designer.name}. Questions should be appropriate for a ${stageLabel} designer, address the open topics, and draw on themes from recent sessions.`
  }

  return (
    <div className="border-t px-4 py-3 shrink-0 bg-muted/20 flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Coaching Brief</span>
      <div className="flex gap-2">
        <SplitButton
          label="Ask Claude: Brief"
          onAsk={() => onOpenClaude(buildBriefPrompt(), `Coaching Brief — ${designer.name}`)}
          onCopy={() => navigator.clipboard.writeText(buildBriefPrompt()).catch(() => {})}
        />
        <SplitButton
          label="Ask Claude: Questions"
          onAsk={() => onOpenClaude(buildQuestionsPrompt(), `1:1 Questions — ${designer.name}`)}
          onCopy={() => navigator.clipboard.writeText(buildQuestionsPrompt()).catch(() => {})}
        />
      </div>
    </div>
  )
}
