import avatar from '../assets/fx/avatar.svg'
import plusDark from '../assets/icons/plus-dark.svg'
import Banner from './Banner'
import { BudgetByCategory, BudgetLeft, CurrentCosplay, NextEvent, QuickAccess, TodayTasks, WeekTime } from './panels'
import { Button, GlitchTitle } from '../components/ui'
import { useStore } from '../data/useStore'
import { openCosplay } from '../router'
import NewCosplayDialog from '../components/NewCosplayDialog'
import { useState } from 'react'

export default function Dashboard() {
  const { state, today } = useStore()
  const { profile } = state
  const [creating, setCreating] = useState(false)
  const longDate = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const readoutDate = today.toLocaleDateString('fr-FR').replaceAll('/', '.')

  return (
    <>
      <Banner today={today} />

      <img src={avatar} alt="" className="absolute top-[123px] left-[22px] h-[137.3px] w-[116px] max-w-none" />

      <div className="flex flex-wrap items-start justify-between gap-4 pt-[14px] pr-6 pl-[164px]">
        <div className="animate-rise">
          <h2 className="text-[28px] leading-[34px]">
            <GlitchTitle>{`Bonjour ${profile.name} — prête pour une nouvelle session ?`}</GlitchTitle>
          </h2>
          <p className="mt-2 text-[11px] tracking-[0.44px] whitespace-pre text-argent">
            {`${longDate.charAt(0).toUpperCase()}${longDate.slice(1)}  ·  « ${profile.motto} »`}
          </p>
        </div>
        <div className="mt-[2px] flex gap-3">
          <Button variant="primary" icon={plusDark} className="w-[170px]" onClick={() => setCreating(true)}>
            NOUVEAU COSPLAY
          </Button>
        </div>
      </div>

      <div className="mt-[22px] grid gap-x-6 gap-y-4 px-6 xl:grid-cols-[268px_minmax(0,1fr)_388px] xl:grid-rows-[300px_280px]">
        <QuickAccess className="animate-rise xl:row-span-2" />
        <div className="animate-rise [animation-delay:60ms]">
          <CurrentCosplay />
        </div>
        <div className="flex animate-rise flex-col gap-4 [animation-delay:120ms]">
          <NextEvent />
          <BudgetLeft />
        </div>
        <div className="grid animate-rise gap-4 [animation-delay:180ms] md:grid-cols-2">
          <TodayTasks />
          <BudgetByCategory />
        </div>
        <div className="animate-rise [animation-delay:240ms]">
          <WeekTime />
        </div>
      </div>

      {creating && <NewCosplayDialog onClose={() => setCreating(false)} onCreated={openCosplay} />}

      <p className="mt-1 pr-6 text-right text-[9px] tracking-[1.08px] whitespace-pre text-cyan/55" aria-hidden>
        {`ANGEL.OS v3.0  //  SIGNAL ▮▮▮▮▯  //  HALO SYNC OK  //  ${readoutDate}`}
      </p>
    </>
  )
}
