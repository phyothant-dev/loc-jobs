import { Brand } from "@/constants/theme";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Brand.white}
      indicatorColor={Brand.primary}
      iconColor={{
        default: "#9CA3AF", // gray when inactive
        selected: Brand.primary, // your brand color when active
      }}
      labelStyle={{
        default: { color: "#9CA3AF" },
        selected: { color: Brand.primary, fontWeight: "700" },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>All Jobs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
          md="work"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my-jobs">
        <NativeTabs.Trigger.Label>My Jobs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark.fill" }}
          md="bookmark"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
