import { Badge, DataList, HStack } from '@chakra-ui/react'
import type { User } from '../../types'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  return (
    <DataList.Root orientation="horizontal" aria-label="Account details">
      <DataList.Item>
        <DataList.ItemLabel>Name</DataList.ItemLabel>
        <DataList.ItemValue>{user.full_name ?? 'Not set'}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Email</DataList.ItemLabel>
        <DataList.ItemValue>{user.email}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Sign-in method</DataList.ItemLabel>
        <DataList.ItemValue>{user.oauth_provider ?? 'Email and password'}</DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Status</DataList.ItemLabel>
        <DataList.ItemValue>
          <HStack gap={2}>
            <Badge colorPalette={user.is_active ? 'green' : 'red'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
            <Badge colorPalette={user.is_verified ? 'green' : 'orange'}>{user.is_verified ? 'Verified' : 'Unverified'}</Badge>
          </HStack>
        </DataList.ItemValue>
      </DataList.Item>
      <DataList.Item>
        <DataList.ItemLabel>Member since</DataList.ItemLabel>
        <DataList.ItemValue>{new Date(user.created_at).toLocaleDateString()}</DataList.ItemValue>
      </DataList.Item>
    </DataList.Root>
  )
}
