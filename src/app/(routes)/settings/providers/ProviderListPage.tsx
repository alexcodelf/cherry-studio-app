import BottomSheet from '@gorhom/bottom-sheet'
import { useNavigation } from '@react-navigation/native'
import { Plus } from '@tamagui/lucide-icons'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, Text, useTheme, YStack } from 'tamagui'

import { SettingContainer, SettingGroup } from '@/components/Settings'
import { HeaderBar } from '@/components/Settings/HeaderBar'
import { AddProviderSheet } from '@/components/Settings/Providers/AddProviderSheet'
import { ProviderItem } from '@/components/Settings/Providers/ProviderItem'
import CustomRadialGradientBackground from '@/components/UI/CustomRadialGradientBackground'
import { SearchInput } from '@/components/UI/SearchInput'
import { useAllProviders } from '@/hooks/use-providers'

export default function ProviderListPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const navigation = useNavigation()

  const bottomSheetRef = useRef<BottomSheet>(null)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  const { providers } = useAllProviders()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProviderType, setSelectedProviderType] = useState<string | undefined>(undefined)
  const [providerName, setProviderName] = useState('')

  const handleProviderTypeChange = (value: string) => {
    setSelectedProviderType(value)
  }

  const handleProviderNameChange = (name: string) => {
    setProviderName(name)
  }

  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.expand()
    setIsBottomSheetOpen(true)
  }, [])

  const handleBottomSheetClose = useCallback(() => {
    setIsBottomSheetOpen(false)
  }, [])

  const onAddProvider = () => {
    handleOpenBottomSheet()
  }

  const handleAddProvider = () => {
    console.log('Provider Name:', providerName)
    console.log('Provider Type:', selectedProviderType)
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{
        flex: 1,
        backgroundColor: theme.background.val
      }}>
      <HeaderBar
        title={t('settings.provider.list.title')}
        onBackPress={() => navigation.goBack()}
        rightButton={{
          icon: <Plus size={24} />,
          onPress: onAddProvider
        }}
      />
      <SettingContainer>
        <SearchInput placeholder={t('settings.provider.search')} value={searchQuery} onChangeText={setSearchQuery} />

        <YStack flex={1} gap={8}>
          <Text>{t('settings.provider.title')}</Text>
          <CustomRadialGradientBackground style={{ radius: 2 }}>
            <ScrollView backgroundColor="$colorTransparent">
              <SettingGroup>
                {providers.map(p => (
                  <ProviderItem key={p.id} provider={p} mode="checked" />
                ))}
              </SettingGroup>
            </ScrollView>
          </CustomRadialGradientBackground>
        </YStack>
      </SettingContainer>

      <AddProviderSheet
        bottomSheetRef={bottomSheetRef}
        isOpen={isBottomSheetOpen}
        onClose={handleBottomSheetClose}
        providerName={providerName}
        onProviderNameChange={handleProviderNameChange}
        selectedProviderType={selectedProviderType}
        onProviderTypeChange={handleProviderTypeChange}
        onAddProvider={handleAddProvider}
      />
    </SafeAreaView>
  )
}
