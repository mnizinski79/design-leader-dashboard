"use client"

import { useState } from "react"
import { DesignerItem } from "@/types"
import { SKILL_LABELS, ALL_SKILL_KEYS, tierLabel } from "@/components/coaching/lib/skills"
import { DREYFUS_DESCRIPTIONS, DREYFUS_LABELS } from "@/components/coaching/lib/coaching-framework"

interface Props {
  designer: DesignerItem
}

export function CoachingBrief({ designer }: Props) {
  const [copiedBrief, setCopiedBrief] = useState(false)
  const [copiedQuestions, setCopiedQuestions] = useState(false)

  function buildSkillMap(): Record<string, number> {
    const map: Record<string, number> = {}
    ALL_SKILL_KEYS.forEach((k) => { map[k] = 0 })
    designer.skills.forEach((s) => { map[s.skillName] = s.value })
    return map
  }

  function copyBrief() {
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

    const stageApproach = stageDesc

    const brief = `Designer: ${designer.name}, ${designer.role}, ${designer.roleLevel}
Dreyfus Stage: ${stageLabel} — ${stageDesc}

Skills:
${skillLines}

Active Goals:
${goalLines}

Recent Sessions (last 3):
${sessionLines}

Stakeholder Feedback:
${feedbackLines}

Please provide personalized coaching guidance for ${designer.name} framed specifically for a ${stageLabel} designer. Focus on: ${stageApproach}`

    navigator.clipboard.writeText(brief).catch(() => {})
    setCopiedBrief(true)
    setTimeout(() => setCopiedBrief(false), 2000)
  }

  function copyQuestions() {
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

    const prompt = `Designer: ${designer.name}, ${designer.role} (${designer.roleLevel})
Dreyfus Stage: ${stageLabel} — ${stageDesc}

Open 1:1 Topics:
${topicList}

Recent Session Themes:
${sessionThemes}

Please generate 6 tailored 1:1 coaching questions for ${designer.name}. Questions should be appropriate for a ${stageLabel} designer, address the open topics, and draw on themes from recent sessions.`

    navigator.clipboard.writeText(prompt).catch(() => {})
    setCopiedQuestions(true)
    setTimeout(() => setCopiedQuestions(false), 2000)
  }

  return (
    <div className="border-t px-4 py-3 shrink-0 bg-muted/20 flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground shrink-0">Coaching Brief</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyBrief}
          className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted transition-colors bg-background"
        >
          {copiedBrief ? "Copied!" : "Copy Coaching Brief"}
        </button>
        <button
          type="button"
          onClick={copyQuestions}
          className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted transition-colors bg-background"
        >
          {copiedQuestions ? "Copied!" : "Copy Coaching Questions"}
        </button>
      </div>
    </div>
  )
}
