"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Props {
  initialName: string
  email: string
}

export function AccountPageClient({ initialName, email }: Props) {
  const router = useRouter()
  const { update } = useSession()

  // Profile state
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName) // tracks last-saved value for disabled check
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleProfileSave() {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const data = await res.json()
        setSavedName(data.name)
        await update({ name: data.name })
        router.refresh()
        setProfileMsg({ type: "success", text: "Name updated" })
      } else {
        const data = await res.json()
        setProfileMsg({ type: "error", text: data.error ?? "Failed to update name" })
      }
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordUpdate() {
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" })
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordMsg({ type: "success", text: "Password updated" })
      } else {
        const data = await res.json()
        setPasswordMsg({ type: "error", text: data.error ?? "Failed to update password" })
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const profileUnchanged = name.trim() === savedName || name.trim() === ""

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Account</h1>
      <p className="text-sm text-slate-500 mb-8">Manage your profile and password</p>

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-4">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Profile</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              readOnly
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-300 italic">read-only</span>
          </div>
        </div>

        {profileMsg && (
          <p className={`text-sm mb-3 ${profileMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {profileMsg.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleProfileSave}
            disabled={profileUnchanged || profileSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {profileSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Change password</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {passwordMsg && (
          <p className={`text-sm mb-3 ${passwordMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {passwordMsg.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handlePasswordUpdate}
            disabled={!currentPassword || !newPassword || !confirmPassword || passwordSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </div>
    </div>
  )
}
