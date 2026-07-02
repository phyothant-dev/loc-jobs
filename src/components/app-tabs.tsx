import { Brand } from "@/constants/theme";
import { useLocale } from "@/contexts/LocaleContext";
import { useFilterCount } from "@/contexts/FilterCountContext";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppTabs() {
  const { t } = useLocale()
  const { counts } = useFilterCount()
  return (
    <NativeTabs backgroundColor={Brand.white} badgeTextColor="#fff">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.nearby')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
        <NativeTabs.Trigger.Badge hidden={counts.nearby === 0}>
          {counts.nearby > 0 ? String(counts.nearby) : ""}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>{t('tabs.explore')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "tray", selected: "tray.fill" }}
          md="search"
        />
        <NativeTabs.Trigger.Badge hidden={counts.explore === 0}>
          {counts.explore > 0 ? String(counts.explore) : ""}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-jobs">
        <NativeTabs.Trigger.Label>{t('tabs.myJobs')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
          md="work"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>{t('tabs.chat')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat"
        />
        <NativeTabs.Trigger.Badge hidden={counts.chat === 0}>
          {counts.chat > 0 ? (counts.chat > 9 ? '9+' : String(counts.chat)) : ''}
        </NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
