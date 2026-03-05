'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { StarRating } from './star-rating'
import type { Review } from '@/lib/types'

interface EditReplyModalProps {
  review: Review
  onClose: () => void
  onSave: (reviewId: string, editedText: string) => Promise<void>
}

export function EditReplyModal({ review, onClose, onSave }: EditReplyModalProps) {
  const [text, setText] = useState(review.reply?.final_text || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await onSave(review.id, text)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-xl bg-white shadow-2xl sm:max-h-none sm:max-w-lg sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Reply</h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Original Review */}
        <div className="border-b px-4 py-4 sm:px-6">
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={review.star_rating} size={14} />
            <span className="text-sm font-medium text-gray-700">
              {review.reviewer_name}
            </span>
          </div>
          {review.review_text && (
            <p className="text-sm text-gray-600">{review.review_text}</p>
          )}
          {!review.review_text && (
            <p className="text-sm italic text-gray-400">No review text provided</p>
          )}
        </div>

        {/* Edit Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Your Reply
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Write your reply..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t px-4 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
