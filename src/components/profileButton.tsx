import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Bell,
  CreditCard,
  SunMoon,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Building2,
  Plus,
  Check
} from "lucide-react"

type Organization = {
  id: string;
  name: string;
  avatar?: string;
}

type ProfileButtonProps = {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  organizations?: Organization[];
  currentOrgId?: string;
  onOrgChange?: (orgId: string) => void;
  onCreateOrg?: () => void;
  onThemeToggle?: (isDark: boolean) => void;
  isDarkMode?: boolean;
}

const ProfileButton = ({ 
  
  // TODO: Fetch real user and org data from context or props
  user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://github.com/shadcn.png"
  },
  organizations = [],
  currentOrgId = "",
  onOrgChange,
  onCreateOrg,

}: ProfileButtonProps) => {
  
    const { theme, setTheme } = useTheme();
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isDarkMode = theme === 'dark';
  function onThemeToggle() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all hover:opacity-80 ' >
          <Avatar className='cursor-pointer h-10 w-10'>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className='bg-primary text-primary-foreground font-medium'>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className='w-64' align='end' sideOffset={8}>
        {/* User Info Section */}
        <DropdownMenuLabel className='p-0'>
          <div className='flex items-center gap-3 px-2 py-3'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className='bg-primary text-primary-foreground font-medium'>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col space-y-1 flex-1 min-w-0'>
              <p className='text-sm font-semibold text-foreground truncate'>
                {user.name}
              </p>
              <p className='text-xs text-muted-foreground truncate'>
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Organization Switcher */}
        {organizations.length > 0 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className='cursor-pointer gap-3 py-2.5'>
                <Building2 className='h-4 w-4 text-muted-foreground' />
                <div className='flex flex-col items-start flex-1 min-w-0'>
                  <span className='text-sm'>Organization</span>
                  {currentOrg && (
                    <span className='text-xs text-muted-foreground truncate max-w-40'>
                      {currentOrg.name}
                    </span>
                  )}
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className='w-56'>
                <DropdownMenuLabel className='text-xs text-muted-foreground font-normal px-2 py-1.5'>
                  Switch Organization
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={currentOrgId} onValueChange={onOrgChange}>
                  {organizations.map((org) => (
                    <DropdownMenuRadioItem 
                      key={org.id} 
                      value={org.id}
                      className='cursor-pointer gap-3 py-2.5'
                    >
                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                        <Avatar className='h-6 w-6'>
                          <AvatarImage src={org.avatar} alt={org.name} />
                          <AvatarFallback className='bg-primary/10 text-primary text-xs font-medium'>
                            {getInitials(org.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm truncate'>{org.name}</span>
                      </div>
                      {currentOrgId === org.id && (
                        <Check className='h-4 w-4 text-primary' />
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className='cursor-pointer gap-3 py-2.5 text-primary focus:text-primary'
                  onClick={onCreateOrg}
                >
                  <Plus className='h-4 w-4' />
                  <span className='text-sm font-medium'>Create Organization</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Account Actions */}
        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5'>
          <User className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5'>
          <Settings className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5'>
          <CreditCard className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>Billing</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5'>
          <Bell className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Toggle */}
        <div className='px-2 py-2.5 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <SunMoon className='h-4 w-4 text-muted-foreground' />
            <Label htmlFor='theme-toggle' className='text-sm cursor-pointer'>
              Dark Mode
            </Label>
          </div>
          <Switch 
            id='theme-toggle' 
            checked={isDarkMode}
            onCheckedChange={onThemeToggle}
            className='data-[state=checked]:bg-primary'
          />
        </div>

        <DropdownMenuSeparator />

        {/* Help & Logout */}
        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5'>
          <HelpCircle className='h-4 w-4 text-muted-foreground' />
          <span className='text-sm'>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuItem className='cursor-pointer gap-3 py-2.5 text-destructive focus:text-destructive'>
          <LogOut className='h-4 w-4' />
          <span className='text-sm font-medium'>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ProfileButton