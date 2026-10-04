/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Download, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'

import {
  deleteInvalidRedemptions,
  exportRedemptions,
  getRedemptionCategories,
} from '../api'
import { ERROR_MESSAGES } from '../constants'
import { useRedemptions } from './redemptions-provider'

export function RedemptionsPrimaryButtons() {
  const { t } = useTranslation()
  const { setOpen, triggerRefresh } = useRedemptions()
  const [showDeleteInvalidConfirm, setShowDeleteInvalidConfirm] =
    useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    void getRedemptionCategories().then((result) => {
      if (result.success) setCategories(result.data ?? [])
    })
  }, [])

  const handleExport = async () => {
    if (!selectedCategory) return
    setIsExporting(true)
    try {
      const blob = await exportRedemptions(selectedCategory)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedCategory}-兑换码.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(t('Export completed'))
    } catch {
      toast.error(t('Failed to export redemption codes'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteInvalid = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteInvalidRedemptions()
      if (result.success) {
        const count = result.data || 0
        toast.success(
          t('Successfully deleted {{count}} invalid redemption codes', {
            count,
          })
        )
        triggerRefresh()
        setShowDeleteInvalidConfirm(false)
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.DELETE_INVALID_FAILED))
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='flex flex-wrap gap-2'>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className='border-input bg-background h-8 rounded-lg border px-2 text-sm'
          aria-label={t('Redemption category')}
        >
          <option value=''>{t('Select category')}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <Button
          size='sm'
          variant='outline'
          disabled={!selectedCategory || isExporting}
          onClick={() => void handleExport()}
        >
          <Download className='h-4 w-4' />
          {t('Export category')}
        </Button>
        <Button
          size='sm'
          variant='outline'
          onClick={() => setShowDeleteInvalidConfirm(true)}
        >
          <Trash2 className='text-destructive h-4 w-4' />
          {t('Delete Invalid')}
        </Button>
        <Button size='sm' onClick={() => setOpen('create')}>
          <Plus className='h-4 w-4' />
          {t('Create Code')}
        </Button>
      </div>

      <ConfirmDialog
        destructive
        open={showDeleteInvalidConfirm}
        onOpenChange={setShowDeleteInvalidConfirm}
        handleConfirm={handleDeleteInvalid}
        isLoading={isDeleting}
        className='max-w-md'
        title={t('Delete Invalid Redemption Codes?')}
        desc={
          <>
            {t('This will delete all')} <strong>{t('used')}</strong>,{' '}
            <strong>{t('disabled')}</strong>
            {t(', and')} <strong>{t('expired')}</strong>{' '}
            {t('redemption codes.')}
            <br />
            {t('This action cannot be undone.')}
          </>
        }
        confirmText={t('Delete Invalid')}
      />
    </>
  )
}
