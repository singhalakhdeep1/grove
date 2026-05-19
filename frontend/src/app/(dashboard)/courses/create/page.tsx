'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { coursesApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import toast from 'react-hot-toast'

const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const levelOptions = levels.map((l) => ({ value: l, label: l.charAt(0) + l.slice(1).toLowerCase() }))

export default function CreateCoursePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
    price: '',
    language: 'English',
    requirements: [''],
    learningGoals: [''],
  })

  const create = useMutation({
    mutationFn: () => coursesApi.create({
      ...form,
      price: form.price ? parseFloat(form.price) : 0,
      requirements: form.requirements.filter(Boolean),
      learningGoals: form.learningGoals.filter(Boolean),
    }),
    onSuccess: (data: any) => {
      toast.success('Course created!')
      router.push(`/courses/${data.id}`)
    },
    onError: () => toast.error('Failed to create course'),
  })

  const updateListItem = (field: 'requirements' | 'learningGoals', index: number, value: string) => {
    const updated = [...form[field]]
    updated[index] = value
    setForm({ ...form, [field]: updated })
  }

  const addListItem = (field: 'requirements' | 'learningGoals') => {
    setForm({ ...form, [field]: [...form[field], ''] })
  }

  const removeListItem = (field: 'requirements' | 'learningGoals', index: number) => {
    setForm({ ...form, [field]: form[field].filter((_, i) => i !== index) })
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/courses/my-courses" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to My Courses
      </Link>

      <h1>Create New Course</h1>

      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Course Title"
            placeholder="e.g. Complete React Developer Course"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe what students will learn..."
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Level"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              options={levelOptions}
            />
            <Input
              label="Price ($)"
              type="number"
              placeholder="0 for free"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <Input
              label="Language"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.requirements.map((req, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={`Requirement ${i + 1}`}
                value={req}
                onChange={(e) => updateListItem('requirements', i, e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeListItem('requirements', i)} disabled={form.requirements.length === 1}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addListItem('requirements')}>
            <Plus className="h-4 w-4 mr-1" /> Add Requirement
          </Button>
        </CardContent>
      </Card>

      {/* Learning Goals */}
      <Card>
        <CardHeader><CardTitle>What Students Will Learn</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.learningGoals.map((goal, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={`Learning goal ${i + 1}`}
                value={goal}
                onChange={(e) => updateListItem('learningGoals', i, e.target.value)}
              />
              <Button variant="ghost" size="icon" onClick={() => removeListItem('learningGoals', i)} disabled={form.learningGoals.length === 1}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addListItem('learningGoals')}>
            <Plus className="h-4 w-4 mr-1" /> Add Goal
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button
          onClick={() => create.mutate()}
          loading={create.isPending}
          disabled={!form.title || !form.description}
        >
          Create Course
        </Button>
      </div>
    </div>
  )
}
