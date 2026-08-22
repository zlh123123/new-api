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
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Code2,
  Gauge,
  Headphones,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'

interface HeroProps {
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { logo, systemName } = useSystemConfig()
  const brandName = systemName === 'New API' ? 'haoji api' : systemName
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'
  const serverAddress = status?.server_address as string | undefined
  const isLocalPreview =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  const apiOrigin = isLocalPreview
    ? 'https://haoji.blog'
    : serverAddress || 'https://haoji.blog'
  const apiUrl = `${apiOrigin.replace(/\/$/, '')}/v1`

  const renderDocsButton = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-medium'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
          <span>{t('Docs')}</span>
        </Button>
      )
    }
    return (
      <Button
        variant='outline'
        className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-lg px-5 text-sm font-medium'
        render={<Link to={docsUrl} />}
      >
        <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
        <span>{t('Docs')}</span>
      </Button>
    )
  }

  return (
    <section className='relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-sky-50/70 px-4 py-20 sm:px-6 dark:bg-slate-950/80'>
      <div aria-hidden className='pointer-events-none absolute inset-0'>
        <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(14,165,233,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,0.06)_1px,transparent_1px)] bg-[size:3rem_3rem]' />
      </div>

      <div className='relative mx-auto flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:justify-center'>
        <div className='flex max-w-xl flex-1 flex-col justify-center text-center lg:pr-10 lg:text-left'>
          <div className='mb-5 inline-flex items-center justify-center gap-2 lg:justify-start'>
            <img
              src={logo}
              alt={t('Logo')}
              className='size-11 rounded-2xl object-cover shadow-sm ring-1 ring-sky-500/15'
            />
            <span className='text-xl font-semibold tracking-tight'>
              {brandName}
            </span>
          </div>
          <p className='mb-3 text-xs font-semibold tracking-[0.18em] text-sky-700/70 uppercase dark:text-sky-300/70'>
            {t('AI API gateway for your applications')}
          </p>
          <h1 className='text-4xl leading-[1.08] font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white'>
            {t('One endpoint for every model you use')}
          </h1>
          <p className='mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300'>
            {t(
              'Connect your tools to a stable, compatible API and manage keys, usage, and routing from one console.'
            )}
          </p>
          <div className='mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start'>
            {[
              { icon: ShieldCheck, label: t('Secure access') },
              { icon: Gauge, label: t('Usage controls') },
              { icon: Code2, label: t('OpenAI compatible') },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className='inline-flex items-center gap-2 rounded-full border border-sky-900/10 bg-white/70 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
              >
                <Icon className='size-3.5 text-sky-600 dark:text-sky-300' />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className='w-full max-w-md rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7 dark:border-white/10 dark:bg-slate-900/80'>
          <div className='mb-6 flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold tracking-[0.16em] text-sky-600 uppercase dark:text-sky-300'>
                {t('Quick start')}
              </p>
              <h2 className='mt-2 text-2xl font-semibold tracking-tight'>
                {t('Your API endpoint')}
              </h2>
            </div>
            <div className='flex size-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-300'>
              <KeyRound className='size-5' />
            </div>
          </div>

          <div className='rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5'>
            <div className='mb-2 flex items-center justify-between gap-3'>
              <span className='text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400'>
                {t('Base URL')}
              </span>
              <CopyButton
                value={apiUrl}
                tooltip={t('Copy to clipboard')}
                aria-label={t('Copy to clipboard')}
                className='size-8 rounded-xl'
              />
            </div>
            <code className='block overflow-x-auto text-sm font-medium whitespace-nowrap text-slate-900 dark:text-slate-100'>
              {apiUrl}
            </code>
          </div>

          <div className='mt-5 grid gap-2.5'>
            {props.isAuthenticated ? (
              <Button
                className='h-11 w-full justify-center gap-2 rounded-xl'
                render={<Link to='/dashboard' />}
              >
                {t('Go to Dashboard')} <ArrowRight className='size-4' />
              </Button>
            ) : (
              <>
                <Button
                  className='h-11 w-full justify-center gap-2 rounded-xl'
                  render={<Link to='/sign-in' />}
                >
                  {t('Sign in')} <ArrowRight className='size-4' />
                </Button>
                {status?.register_enabled !== false && (
                  <Button
                    variant='outline'
                    className='h-11 w-full justify-center rounded-xl'
                    render={<Link to='/sign-up' />}
                  >
                    {t('Create an account')}
                  </Button>
                )}
              </>
            )}
          </div>

          <div className='mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 dark:border-white/10'>
            {renderDocsButton()}
            <div className='group relative'>
              <Button
                variant='outline'
                aria-haspopup='dialog'
                className='border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium'
              >
                <Headphones className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
                <span>{t('Contact support')}</span>
              </Button>
              <div className='pointer-events-none invisible absolute right-0 bottom-full z-20 mb-3 w-52 translate-y-2 rounded-2xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-slate-900'>
                <img
                  src='/customer-service-qr.svg'
                  alt={t('Contact support')}
                  className='aspect-square w-full rounded-xl bg-white object-contain p-2'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
