import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock3,
  Inbox,
  MessageCircle,
  Paperclip,
  Send,
  Ticket,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  replySupportTicket,
  updateSupportTicketStatus,
} from '@/lib/api'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const emptyTickets: any[] = []

function AttachmentPicker({
  files,
  setFiles,
}: {
  files: File[]
  setFiles: (files: File[]) => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <input
        ref={input}
        type='file'
        accept='image/jpeg,image/png,image/gif,image/webp'
        multiple
        className='hidden'
        onChange={(event) => {
          setFiles(
            [...files, ...(event.target.files ?? [])].slice(0, 5)
          )
          event.target.value = ''
        }}
      />
      <Button
        type='button'
        variant='ghost'
        size='sm'
        className='text-muted-foreground hover:text-foreground px-2'
        onClick={() => input.current?.click()}
      >
        <Paperclip className='mr-1.5 size-4' />
        {t('Add images')}
      </Button>
      {files.map((file, index) => (
        <Badge
          key={`${file.name}-${file.size}-${file.lastModified}`}
          variant='secondary'
          className='max-w-48 gap-1.5 truncate'
        >
          <span className='truncate'>{file.name}</span>
          <button
            type='button'
            aria-label={t('Remove')}
            onClick={() => setFiles(files.filter((_, i) => i !== index))}
          >
            <X className='size-3' />
          </button>
        </Badge>
      ))}
    </div>
  )
}

function TicketStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  const closed = status === 'closed'
  return (
    <Badge
      variant={closed ? 'secondary' : 'default'}
      className='gap-1.5 rounded-full px-2.5'
    >
      {closed ? <CheckCircle2 className='size-3' /> : <Clock3 className='size-3' />}
      {closed ? t('Closed') : t('Open')}
    </Badge>
  )
}

export function SupportPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [reply, setReply] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])

  const tickets = useQuery({
    queryKey: ['support-tickets'],
    queryFn: listSupportTickets,
  })
  const detail = useQuery({
    queryKey: ['support-ticket', selected],
    queryFn: () => getSupportTicket(selected as number),
    enabled: selected !== null,
  })
  const create = useMutation({
    mutationFn: () => createSupportTicket({ subject, content, files }),
    onSuccess: (ticket) => {
      setSubject('')
      setContent('')
      setFiles([])
      setSelected(ticket.id)
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      toast.success(t('Ticket submitted'))
    },
  })
  const send = useMutation({
    mutationFn: () => replySupportTicket(selected as number, reply, replyFiles),
    onSuccess: () => {
      setReply('')
      setReplyFiles([])
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selected] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
  const close = useMutation({
    mutationFn: (status: 'open' | 'closed') =>
      updateSupportTicketStatus(selected as number, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selected] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })

  const items = tickets.data ?? emptyTickets
  const current = detail.data
  useEffect(() => {
    if (selected === null && items.length > 0 && isAdmin) setSelected(items[0].id)
  }, [items, selected, isAdmin])

  const attachmentUrl = (id: number) => `/api/support/attachments/${id}`
  const startNewTicket = () => {
    setSelected(null)
    setSubject('')
    setContent('')
    setFiles([])
  }
  const submitTicket = () => {
    if (subject.trim() && content.trim()) create.mutate()
  }

  return (
    <div className='flex h-full min-h-0 flex-col overflow-auto bg-muted/20 p-4 md:p-6'>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-5'>
        <div className='flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
          <div>
            <div className='mb-2 flex items-center gap-2 text-sm font-medium text-primary'>
              <Ticket className='size-4' />
              {t('Support')}
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              {isAdmin ? t('Support tickets') : t('My support tickets')}
            </h1>
            {!isAdmin && (
              <p className='text-muted-foreground mt-1 text-sm'>
                {t('Send a message and optional screenshots. We will reply here.')}
              </p>
            )}
          </div>
          {!isAdmin && (
            <Button onClick={startNewTicket}>
              <Ticket className='mr-2 size-4' />
              {t('New ticket')}
            </Button>
          )}
        </div>

        <div className='grid min-h-0 gap-5 lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)]'>
          <Card className='min-h-0 overflow-hidden'>
            <CardHeader className='border-b bg-background/70 pb-4'>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Inbox className='text-muted-foreground size-4' />
                {t('Tickets')}
                <span className='text-muted-foreground ml-auto text-xs font-normal'>
                  {items.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className='max-h-[calc(100vh-260px)] space-y-2 overflow-y-auto p-3'>
              {items.map((item: any) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => setSelected(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selected === item.id ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/60'}`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <span className='line-clamp-2 text-sm font-medium'>{item.subject}</span>
                    <TicketStatus status={item.status} />
                  </div>
                  <div className='text-muted-foreground mt-2 flex items-center gap-1 text-xs'>
                    <Clock3 className='size-3' />
                    {new Date(item.last_message_at).toLocaleString()}
                  </div>
                  {((isAdmin && item.admin_unread) || (!isAdmin && item.user_unread)) && (
                    <Badge variant='destructive' className='mt-2 rounded-full'>
                      {t('New reply')}
                    </Badge>
                  )}
                </button>
              ))}
              {!items.length && (
                <div className='text-muted-foreground flex flex-col items-center px-4 py-12 text-center text-sm'>
                  <Inbox className='mb-3 size-8 opacity-40' />
                  <p>{t('No tickets yet')}</p>
                  {!isAdmin && <p className='mt-1 text-xs'>{t('Create a support ticket')}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <div className='min-w-0'>
            {current ? (
              <Card className='overflow-hidden'>
                <CardHeader className='flex-row items-start justify-between gap-4 border-b bg-background/70'>
                  <div className='min-w-0'>
                    <CardTitle className='truncate text-lg'>{current.subject}</CardTitle>
                    <div className='mt-2 flex items-center gap-2'>
                      <TicketStatus status={current.status} />
                      <span className='text-muted-foreground text-xs'>#{current.id}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => close.mutate(current.status === 'closed' ? 'open' : 'closed')}
                    >
                      {current.status === 'closed' ? t('Reopen') : t('Close ticket')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className='space-y-4 p-4 md:p-6'>
                  <div className='space-y-3'>
                    {current.messages?.map((message: any) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl border p-4 ${message.role === 'admin' ? 'border-primary/20 bg-primary/5' : 'bg-background'}`}
                      >
                        <div className='mb-2 flex items-center gap-2 text-xs text-muted-foreground'>
                          <MessageCircle className='size-3.5' />
                          <span className='font-medium'>
                            {message.role === 'admin' ? t('Support') : isAdmin ? t('User') : t('You')}
                          </span>
                          <span>·</span>
                          <span>{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                        <p className='text-sm leading-6 whitespace-pre-wrap'>{message.content}</p>
                        {message.attachments?.length > 0 && (
                          <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                            {message.attachments.map((attachment: any) => (
                              <a key={attachment.id} href={attachmentUrl(attachment.id)} target='_blank' rel='noreferrer'>
                                <img src={attachmentUrl(attachment.id)} alt={attachment.original_name} className='aspect-square w-full rounded-xl object-cover ring-1 ring-border' />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {current.status !== 'closed' && (
                    <div className='space-y-2 border-t pt-4'>
                      <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={t('Write a reply')} rows={4} />
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <AttachmentPicker files={replyFiles} setFiles={setReplyFiles} />
                        <Button disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()}>
                          <Send className='mr-2 size-4' />
                          {t('Send reply')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='flex min-h-[430px] flex-col items-center justify-center p-8 text-center'>
                  <div className='bg-primary/10 mb-4 flex size-14 items-center justify-center rounded-2xl text-primary'>
                    <Ticket className='size-7' />
                  </div>
                  <h2 className='text-lg font-semibold'>{t('Create a support ticket')}</h2>
                  <p className='text-muted-foreground mt-1 max-w-md text-sm'>
                    {t('Send a message and optional screenshots. We will reply here.')}
                  </p>
                  <div className='mt-6 w-full max-w-xl space-y-3 text-left'>
                    <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t('Subject')} />
                    <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t('Describe your issue')} rows={7} />
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <AttachmentPicker files={files} setFiles={setFiles} />
                      <Button disabled={!subject.trim() || !content.trim() || create.isPending} onClick={submitTicket}>
                        <Send className='mr-2 size-4' />
                        {t('Submit ticket')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
