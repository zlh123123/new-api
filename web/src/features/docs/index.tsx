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
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Code2,
  Film,
  KeyRound,
  LockKeyhole,
  MonitorCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { CopyButton } from '@/components/copy-button'
import { PublicLayout } from '@/components/layout'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  API_BASE_URL,
  API_ORIGIN,
  CHAT_EXAMPLE,
  CLAUDE_CONFIG,
  CLAUDE_INSTALL,
  CODEX_CONFIG,
  CODEX_INSTALL,
  CODEX_KEY_UNIX,
  CODEX_KEY_WINDOWS,
  COMMON_ERRORS,
  DEFAULT_TEXT_MODEL,
  IMAGE_EXAMPLE,
  LINUX_NODE_INSTALL,
  LIST_MODELS_EXAMPLE,
  MACOS_NODE_INSTALL,
  NAV_ITEMS,
  OPENCODE_CONFIG,
  OPENCODE_INSTALL,
  RESPONSES_EXAMPLE,
  VIDEO_AUDIO_EXAMPLE,
  VIDEO_FIELDS,
  VIDEO_FRAMES_EXAMPLE,
  VIDEO_REFERENCE_EXAMPLE,
  VIDEO_STATUS_EXAMPLE,
  VIDEO_STATUS_RESPONSE,
  VIDEO_TEXT_EXAMPLE,
  WINDOWS_NODE_INSTALL,
  WORKFLOWS,
} from './constants'

function CodeBlock(props: { code: string; label: string }) {
  return (
    <div className='bg-muted/50 overflow-hidden rounded-xl border'>
      <div className='flex items-center justify-between gap-3 border-b px-4 py-2'>
        <span className='text-muted-foreground text-xs font-medium'>
          {props.label}
        </span>
        <CopyButton
          value={props.code}
          className='size-7'
          iconClassName='size-3.5'
          tooltip='复制代码'
          successTooltip='已复制'
        />
      </div>
      <pre className='overflow-x-auto p-4 text-sm leading-6'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}

function SectionHeading(props: {
  id: string
  step: string
  title: string
  description: string
}) {
  return (
    <div id={props.id} className='scroll-mt-24 space-y-2'>
      <p className='text-primary text-sm font-semibold'>{props.step}</p>
      <h2 className='text-2xl font-bold tracking-tight sm:text-3xl'>
        {props.title}
      </h2>
      <p className='text-muted-foreground max-w-3xl leading-7'>
        {props.description}
      </p>
    </div>
  )
}

function OrderedSteps(props: { children: ReactNode }) {
  return (
    <div className='text-muted-foreground space-y-3 leading-7'>
      {props.children}
    </div>
  )
}

function ValueRow(props: { label: string; value: string }) {
  return (
    <div className='grid gap-1 border-t px-4 py-3 text-sm sm:grid-cols-[220px_1fr] sm:gap-4'>
      <span className='font-medium'>{props.label}</span>
      <div className='flex min-w-0 items-center gap-2'>
        <code className='min-w-0 break-all'>{props.value}</code>
        <CopyButton
          value={props.value}
          className='size-7'
          iconClassName='size-3.5'
          tooltip='复制'
          successTooltip='已复制'
        />
      </div>
    </div>
  )
}

function DocsHero() {
  return (
    <div className='from-primary/10 via-background to-background relative overflow-hidden rounded-3xl border bg-gradient-to-br px-6 py-12 sm:px-10 lg:py-16'>
      <Badge variant='secondary' className='mb-5'>
        <BookOpen className='size-3' /> haoji api 使用文档
      </Badge>
      <h1 className='max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl'>
        从创建密钥到完成第一次调用
      </h1>
      <p className='text-muted-foreground mt-5 max-w-3xl text-base leading-7 sm:text-lg'>
        这份文档包含 Codex、Claude Code、OpenCode、OpenAI 兼容客户端、HTTP API
        和 MiniMax H3 视频生成的完整配置与排错说明。
      </p>
      <div className='mt-7 flex flex-wrap gap-3'>
        <Button render={<Link to='/keys' />}>
          <KeyRound className='size-4' /> 创建 API Key
        </Button>
        <Button variant='outline' render={<a href='#minimax-h3' />}>
          <Film className='size-4' /> 查看 MiniMax H3 教程
        </Button>
      </div>
    </div>
  )
}

function PrepareKeySection() {
  const cards = [
    [KeyRound, '创建令牌', '进入“令牌管理”，点击新增令牌。'],
    [Code2, '复制完整 Key', '创建后立即复制，前后不要带空格或换行。'],
    [MonitorCheck, '检查状态', '确认令牌已启用、额度充足且分组可用。'],
  ] as const

  return (
    <section className='space-y-7'>
      <SectionHeading
        id='prepare-key'
        step='第 1 步'
        title='准备 API Key'
        description='登录控制台，在令牌管理页面创建密钥。API Key 是客户端访问接口的凭证，不是登录密码。'
      />
      <div className='grid gap-4 md:grid-cols-3'>
        {cards.map(([Icon, title, description]) => (
          <Card key={title}>
            <CardHeader className='pb-2'>
              <Icon className='text-primary size-5' />
              <CardTitle className='text-base'>{title}</CardTitle>
            </CardHeader>
            <CardContent className='text-muted-foreground text-sm leading-6'>
              {description}
            </CardContent>
          </Card>
        ))}
      </div>
      <Alert>
        <LockKeyhole className='size-4' />
        <AlertTitle>不要泄露 API Key</AlertTitle>
        <AlertDescription>
          不要把完整 Key
          放进截图、群聊、公开仓库或浏览器前端代码。若已经泄露，请立即在令牌管理中删除并重新创建。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function EnvironmentSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='environment'
        step='第 2 步'
        title='安装基础环境'
        description='Codex、Claude Code 和 OpenCode 都需要 Node.js。已经能够运行 node -v 和 npm -v 的用户可跳过本节。'
      />
      <div className='grid gap-5 xl:grid-cols-3'>
        <div className='space-y-3'>
          <h3 className='font-semibold'>Windows PowerShell</h3>
          <CodeBlock code={WINDOWS_NODE_INSTALL} label='PowerShell' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>macOS</h3>
          <CodeBlock code={MACOS_NODE_INSTALL} label='Terminal' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>Ubuntu / Debian</h3>
          <CodeBlock code={LINUX_NODE_INSTALL} label='Terminal' />
        </div>
      </div>
      <Alert>
        <AlertTriangle className='size-4' />
        <AlertTitle>Windows 注意事项</AlertTitle>
        <AlertDescription>
          不要在 C:\Windows\System32 中操作，也不要混用 CMD 和 PowerShell
          命令。安装完成后关闭所有终端和编辑器，再重新打开。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function AddressSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='address'
        step='第 3 步'
        title='地址填写规则'
        description='地址是否带 /v1 取决于客户端。地址填错是 404、连接失败和反复重连最常见的原因。'
      />
      <div className='overflow-hidden rounded-xl border'>
        <div className='bg-muted/60 px-4 py-3 text-sm font-semibold'>
          常用地址
        </div>
        <ValueRow label='网站与 Claude Code 根地址' value={API_ORIGIN} />
        <ValueRow label='OpenAI 兼容 Base URL' value={API_BASE_URL} />
        <ValueRow
          label='Chat Completions 完整地址'
          value={`${API_BASE_URL}/chat/completions`}
        />
        <ValueRow
          label='Responses 完整地址'
          value={`${API_BASE_URL}/responses`}
        />
        <ValueRow
          label='图片生成完整地址'
          value={`${API_BASE_URL}/images/generations`}
        />
        <ValueRow label='视频任务完整地址' value={`${API_BASE_URL}/videos`} />
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>需要填写 /v1</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm leading-6'>
            Codex、OpenCode、Cherry Studio、OpenClaw，以及标注 OpenAI Compatible
            的通用客户端。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>不要填写 /v1</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm leading-6'>
            Claude Code 的 ANTHROPIC_BASE_URL 只填写网站根地址。
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function CodexSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='codex'
        step='第 4 步'
        title='配置 Codex CLI / App / 编辑器插件'
        description='适用于 Codex CLI、Codex App，以及 VS Code、Cursor、Trae 中的 Codex 插件。'
      />
      <OrderedSteps>
        <p>1. 安装 Codex，并确认能够显示版本号：</p>
        <CodeBlock code={CODEX_INSTALL} label='PowerShell / Terminal' />
        <p>
          2. 打开配置文件：Windows 为{' '}
          <code>%USERPROFILE%\.codex\config.toml</code>，macOS / Linux 为{' '}
          <code>~/.codex/config.toml</code>。
        </p>
        <p>
          3. 将下面内容写入配置文件。模型名必须完整，默认使用{' '}
          {DEFAULT_TEXT_MODEL}。
        </p>
        <CodeBlock code={CODEX_CONFIG} label='~/.codex/config.toml' />
        <p>4. 在启动 Codex 的终端里设置 Key：</p>
        <div className='grid gap-5 xl:grid-cols-2'>
          <CodeBlock code={CODEX_KEY_WINDOWS} label='Windows PowerShell' />
          <CodeBlock code={CODEX_KEY_UNIX} label='macOS / Linux' />
        </div>
        <p>5. 发送“你好，只回复连接成功”，并到调用日志确认产生了新记录。</p>
      </OrderedSteps>
      <Alert>
        <CircleHelp className='size-4' />
        <AlertTitle>Codex 出现 405 或 WebSocket 错误</AlertTitle>
        <AlertDescription>
          检查配置中是否存在 <code>supports_websockets = false</code>，并确认{' '}
          <code>wire_api = &quot;responses&quot;</code>。保存后完全退出 Codex
          再重新打开。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function ClaudeSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='claude-code'
        step='第 5 步'
        title='配置 Claude Code'
        description='Claude Code 使用 Anthropic 协议，Base URL 必须填写根地址，不能带 /v1。'
      />
      <OrderedSteps>
        <p>1. 安装并检查版本：</p>
        <CodeBlock code={CLAUDE_INSTALL} label='PowerShell / Terminal' />
        <p>
          2. 打开配置文件：Windows 为{' '}
          <code>%USERPROFILE%\.claude\settings.json</code>，macOS / Linux 为{' '}
          <code>~/.claude/settings.json</code>。
        </p>
        <p>3. 替换下面的 API Key 后保存：</p>
        <CodeBlock code={CLAUDE_CONFIG} label='~/.claude/settings.json' />
        <p>
          4. 运行 <code>claude</code>，发送“你好，只回复连接成功”。
        </p>
      </OrderedSteps>
      <Alert>
        <AlertTriangle className='size-4' />
        <AlertTitle>模型与实验参数</AlertTitle>
        <AlertDescription>
          切换 Claude 模型时，请同时修改四个模型字段。保留{' '}
          <code>CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS</code>
          ，可避免部分兼容模型收到不支持的实验参数。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function OpenCodeSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='opencode'
        step='第 6 步'
        title='配置 OpenCode'
        description='OpenCode 使用 OpenAI 兼容地址。配置中的 provider 名称可以自定义，但模型前缀必须与 provider 名称一致。'
      />
      <OrderedSteps>
        <p>1. 安装并检查版本：</p>
        <CodeBlock code={OPENCODE_INSTALL} label='PowerShell / Terminal' />
        <p>
          2. 打开配置文件：Windows 为{' '}
          <code>%USERPROFILE%\.config\opencode\opencode.json</code>，macOS /
          Linux 为 <code>~/.config/opencode/opencode.json</code>。
        </p>
        <p>3. 替换 API Key，并按模型广场实际可用模型增删 models：</p>
        <CodeBlock
          code={OPENCODE_CONFIG}
          label='~/.config/opencode/opencode.json'
        />
        <p>
          4. 运行 <code>opencode</code>，发送测试消息。
        </p>
      </OrderedSteps>
    </section>
  )
}

function CompatibleClientsSection() {
  const rows = [
    ['服务商类型', 'OpenAI Compatible / OpenAI 兼容'],
    ['服务商名称', 'haoji api'],
    ['Base URL', API_BASE_URL],
    ['API Key', '令牌管理中复制的完整 Key'],
    ['默认模型', DEFAULT_TEXT_MODEL],
  ]

  return (
    <section className='space-y-7'>
      <SectionHeading
        id='compatible-clients'
        step='第 7 步'
        title='Cherry Studio / OpenClaw / 通用客户端'
        description='只要软件支持 OpenAI Compatible、自定义服务商或自定义 API 地址，通常都可以按本节配置。'
      />
      <div className='overflow-hidden rounded-xl border'>
        <div className='bg-muted/60 grid grid-cols-[150px_1fr] px-4 py-3 text-sm font-medium sm:grid-cols-[220px_1fr]'>
          <span>字段</span>
          <span>填写内容</span>
        </div>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className='grid grid-cols-[150px_1fr] border-t px-4 py-3 text-sm sm:grid-cols-[220px_1fr]'
          >
            <span className='font-medium'>{label}</span>
            <code className='break-all'>{value}</code>
          </div>
        ))}
      </div>
      <p className='text-muted-foreground text-sm leading-7'>
        保存后完全退出客户端再重新打开。如果客户端有“获取模型”按钮，可以自动拉取；否则在模型广场复制完整模型名手动添加。
      </p>
    </section>
  )
}

function ApiExamplesSection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='api-examples'
        step='第 8 步'
        title='HTTP API 调用示例'
        description='所有接口都使用 Authorization: Bearer YOUR_API_KEY。以下命令可以直接复制，替换 Key 和模型后运行。'
      />
      <div className='grid gap-5 xl:grid-cols-2'>
        <div className='space-y-3'>
          <h3 className='font-semibold'>查询可用模型</h3>
          <CodeBlock code={LIST_MODELS_EXAMPLE} label='GET /v1/models' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>Chat Completions</h3>
          <CodeBlock code={CHAT_EXAMPLE} label='POST /v1/chat/completions' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>Responses API</h3>
          <CodeBlock code={RESPONSES_EXAMPLE} label='POST /v1/responses' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>图片生成</h3>
          <CodeBlock code={IMAGE_EXAMPLE} label='POST /v1/images/generations' />
        </div>
      </div>
      <Alert>
        <CircleHelp className='size-4' />
        <AlertTitle>模型以模型广场为准</AlertTitle>
        <AlertDescription>
          如果示例模型不可用，请先请求 <code>GET /v1/models</code>
          或在模型广场复制当前可用的完整模型名，不要自行省略模型后缀。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function VideoWorkflowTable() {
  return (
    <div className='overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-[1080px] text-left text-sm'>
        <thead className='bg-muted/60'>
          <tr>
            {['模型', '时长', '分辨率', '必填输入', '适用场景', '当前计费'].map(
              (title) => (
                <th key={title} className='px-4 py-3 font-medium'>
                  {title}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {WORKFLOWS.map((workflow) => (
            <tr key={workflow.model} className='border-t align-top'>
              <td className='px-4 py-3'>
                <code className='break-all'>{workflow.model}</code>
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>
                {workflow.duration}
              </td>
              <td className='px-4 py-3'>{workflow.sizes}</td>
              <td className='px-4 py-3'>{workflow.input}</td>
              <td className='px-4 py-3'>{workflow.useCase}</td>
              <td className='px-4 py-3'>{workflow.billing}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VideoFieldsTable() {
  return (
    <div className='overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-[760px] text-left text-sm'>
        <thead className='bg-muted/60'>
          <tr>
            {['字段', '类型', '是否必填', '说明'].map((title) => (
              <th key={title} className='px-4 py-3 font-medium'>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VIDEO_FIELDS.map(([field, type, required, description]) => (
            <tr key={field} className='border-t align-top'>
              <td className='px-4 py-3'>
                <code>{field}</code>
              </td>
              <td className='px-4 py-3 whitespace-nowrap'>{type}</td>
              <td className='px-4 py-3 whitespace-nowrap'>{required}</td>
              <td className='px-4 py-3'>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MiniMaxH3Section() {
  const flow = [
    ['1', '创建任务', 'POST /v1/videos'],
    ['2', '保存任务 ID', '返回 id 或 task_id'],
    ['3', '轮询结果', 'GET /v1/videos/{task_id}'],
  ]

  return (
    <section className='space-y-7'>
      <SectionHeading
        id='minimax-h3'
        step='第 9 步'
        title='MiniMax H3 视频生成'
        description='视频生成是异步任务：先创建任务并保存公开任务 ID，再轮询查询，状态完成后从 metadata.url 获取 MP4。'
      />
      <div className='grid gap-4 sm:grid-cols-3'>
        {flow.map(([step, title, detail]) => (
          <Card key={step}>
            <CardContent className='flex gap-3 pt-5'>
              <span className='bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold'>
                {step}
              </span>
              <div>
                <p className='font-medium'>{title}</p>
                <code className='text-muted-foreground mt-1 block text-xs break-all'>
                  {detail}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>六个可用模型</h3>
        <VideoWorkflowTable />
        <p className='text-muted-foreground text-sm leading-6'>
          表中价格单位为
          USD/秒。提交时会按模型、时长和分辨率预扣；任务失败会自动退款，重复查询不会重复扣费。
        </p>
      </div>

      <div className='space-y-3'>
        <h3 className='text-lg font-semibold'>请求字段</h3>
        <VideoFieldsTable />
      </div>

      <div className='grid gap-5 xl:grid-cols-2'>
        <div className='space-y-3'>
          <h3 className='font-semibold'>纯文本生成视频</h3>
          <CodeBlock code={VIDEO_TEXT_EXAMPLE} label='MiniMax H3 · 文生视频' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>参考图生成视频</h3>
          <CodeBlock
            code={VIDEO_REFERENCE_EXAMPLE}
            label='MiniMax H3 · 图生视频'
          />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>首尾帧生成视频</h3>
          <CodeBlock code={VIDEO_FRAMES_EXAMPLE} label='MiniMax H3 · 首尾帧' />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>参考图与音频</h3>
          <CodeBlock
            code={VIDEO_AUDIO_EXAMPLE}
            label='MiniMax H3 · 图片音频驱动'
          />
        </div>
      </div>

      <div className='grid gap-5 xl:grid-cols-2'>
        <div className='space-y-3'>
          <h3 className='font-semibold'>查询任务</h3>
          <CodeBlock
            code={VIDEO_STATUS_EXAMPLE}
            label='GET /v1/videos/{task_id}'
          />
        </div>
        <div className='space-y-3'>
          <h3 className='font-semibold'>完成状态示例</h3>
          <CodeBlock code={VIDEO_STATUS_RESPONSE} label='JSON Response' />
        </div>
      </div>

      <Alert>
        <AlertTriangle className='size-4' />
        <AlertTitle>图片和音频必须能被公网访问</AlertTitle>
        <AlertDescription>
          不要传本机路径、需要登录的网盘地址或有防盗链的临时地址。任务处于
          queued 或 in_progress 时继续查询原任务，不要重复创建。
        </AlertDescription>
      </Alert>
    </section>
  )
}

function VerifySection() {
  return (
    <section className='space-y-7'>
      <SectionHeading
        id='verify'
        step='第 10 步'
        title='检查配置是否成功'
        description='客户端有回复并不一定代表已经使用本站接口，应同时检查客户端结果和后台调用日志。'
      />
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CheckCircle2 className='text-primary size-5' />
            <CardTitle className='text-base'>客户端收到结果</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm leading-6'>
            文本请求能回复“连接成功”；视频请求能返回 task_ 开头的任务 ID。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <MonitorCheck className='text-primary size-5' />
            <CardTitle className='text-base'>调用日志出现记录</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm leading-6'>
            检查调用时间、模型、状态和额度变化是否与刚才的请求一致。
          </CardContent>
        </Card>
      </div>
      <Button variant='outline' render={<Link to='/usage-logs' />}>
        查看调用日志
      </Button>
    </section>
  )
}

function FaqSection() {
  const questions = [
    [
      '为什么一直 Reconnecting 或 Timeout？',
      '可能是本地网络、代理、并发限制或上游响应较慢。先关闭代理或换网络，用 cURL 做最小请求，再重启客户端。',
    ],
    [
      '为什么客户端有回复，后台却没有调用记录？',
      '客户端可能仍在使用官方账号、旧 Base URL 或旧 Key。完全退出客户端，检查配置文件路径后重新启动。',
    ],
    [
      'MiniMax H3 任务为什么被拒绝？',
      '检查模型名是否完整、duration 是否超过上限、size 是否为表中精确值，以及参考图或首尾帧是否缺失。',
    ],
    [
      '视频一直是 queued 或 in_progress 怎么办？',
      '继续查询同一个任务 ID。不要反复提交相同任务，否则会创建多个任务并分别预扣额度。',
    ],
    [
      '如何恢复被改乱的配置？',
      '重新打开对应配置文件：Codex 为 ~/.codex/config.toml，Claude Code 为 ~/.claude/settings.json，OpenCode 为 ~/.config/opencode/opencode.json，然后复制本页完整示例覆盖错误字段。',
    ],
    [
      '忘记登录密码怎么办？',
      '本站不通过邮箱自动找回密码。请打开忘记密码页面，扫描客服二维码，联系人工核验并重置。',
    ],
  ]

  return (
    <section className='space-y-7'>
      <SectionHeading
        id='faq'
        step='第 11 步'
        title='常见问题与恢复配置'
        description='先根据状态码定位问题。联系客服时请提供软件名称、请求时间、模型名和完整错误信息，但不要发送完整 API Key。'
      />
      <div className='overflow-x-auto rounded-xl border'>
        <table className='w-full min-w-[720px] text-left text-sm'>
          <thead className='bg-muted/60'>
            <tr>
              <th className='px-4 py-3'>状态码</th>
              <th className='px-4 py-3'>含义</th>
              <th className='px-4 py-3'>处理方式</th>
            </tr>
          </thead>
          <tbody>
            {COMMON_ERRORS.map(([status, meaning, solution]) => (
              <tr key={status} className='border-t'>
                <td className='px-4 py-3'>
                  <code>{status}</code>
                </td>
                <td className='px-4 py-3 font-medium'>{meaning}</td>
                <td className='px-4 py-3'>{solution}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Accordion className='rounded-xl border px-4'>
        {questions.map(([question, answer]) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent className='text-muted-foreground'>
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Card>
        <CardContent className='flex flex-col items-start justify-between gap-5 pt-6 sm:flex-row sm:items-center'>
          <div className='flex gap-3'>
            <CircleHelp className='text-primary mt-0.5 size-5 shrink-0' />
            <div>
              <p className='font-semibold'>仍然无法解决？</p>
              <p className='text-muted-foreground mt-1 text-sm'>
                准备错误截图和调用时间后联系客服，切勿发送完整 API Key
                或当前密码。
              </p>
            </div>
          </div>
          <Button variant='outline' render={<Link to='/forgot-password' />}>
            联系客服
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export function Docs() {
  return (
    <PublicLayout>
      <div className='mx-auto max-w-7xl pb-20'>
        <DocsHero />
        <div className='mt-10 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]'>
          <aside className='hidden lg:block'>
            <nav className='sticky top-24 space-y-1' aria-label='文档目录'>
              {NAV_ITEMS.map(([href, label]) => (
                <a
                  key={href}
                  href={`#${href}`}
                  className='text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm transition-colors'
                >
                  {label}
                </a>
              ))}
            </nav>
          </aside>
          <main className='min-w-0 space-y-16'>
            <PrepareKeySection />
            <EnvironmentSection />
            <AddressSection />
            <CodexSection />
            <ClaudeSection />
            <OpenCodeSection />
            <CompatibleClientsSection />
            <ApiExamplesSection />
            <MiniMaxH3Section />
            <VerifySection />
            <FaqSection />
          </main>
        </div>
      </div>
    </PublicLayout>
  )
}
