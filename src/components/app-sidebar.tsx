'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, RefreshCw, UserIcon } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGetBalance } from './account/account-data-access'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { ellipsify } from '@/lib/utils'
import { useCluster } from './cluster/cluster-data-access'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from './ui/badge'

const navItems = [
  { label: 'Home', path: '/blogs', icon: Home },
  { label: 'Create Blog', path: '/blogs/create', icon: PlusCircle },
]

const additionalItems = [{ label: 'Lucky Wheel', path: '/lucky-wheel', icon: RefreshCw, badge: 'Weekly' }]

export function AppSidebar() {
  const pathname = usePathname()
  const { publicKey } = useWallet()
  const { data: balance } = useGetBalance({ address: publicKey })
  const { cluster } = useCluster()
  const solBalance = balance ? (balance / LAMPORTS_PER_SOL).toFixed(2) : '0.00'
  const { open } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mt-4 ">
            <SidebarMenuButton className="hover:bg-muted dark:hover:bg-transparent dark:text-white">
              <Link href="/" className="flex items-center gap-2 px-2 py-4">
                <h1 className="text-2xl font-bold font-serif">Solggy</h1>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Network Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Network</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="hover:bg-muted dark:hover:bg-transparent">
                  {open && (
                    <Badge className="">
                      {cluster.network === 'devnet'
                        ? 'Devnet'
                        : cluster.network === 'mainnet-beta'
                          ? 'Mainnet'
                          : cluster.name}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Section */}
        {publicKey && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent className="">
              <SidebarMenu className="space-y-4">
                <SidebarMenuItem>
                  <SidebarMenuButton className="hover:bg-muted dark:hover:bg-transparent">
                    <div className="text-sm font-mono group-data-[collapsible=icon]:hidden dark:text-white">
                      {ellipsify(publicKey.toString(), 6)}
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarGroupLabel>Balance</SidebarGroupLabel>
                  <SidebarMenuButton className="hover:bg-muted dark:hover:bg-transparent dark:text-white">
                    <div className="group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-semibold">{solBalance} SOL</p>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional Items */}
        <SidebarGroup>
          <SidebarGroupLabel>On-chain</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {additionalItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                        {item.badge && (
                          <SidebarMenuBadge className={`${isActive ? 'dark:text-black' : 'dark:text-white'}`}>
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={'account'}>
            <Link href={'/account'}>
              <UserIcon />
              <span>Account</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}
