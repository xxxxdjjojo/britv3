"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ProviderProfileForm } from "@/components/profile/ProviderProfileForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";

export function ProfilePageClient(
  props: Readonly<{ isProvider: boolean }>
) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>General</TabsTrigger>
          {props.isProvider && (
            <TabsTrigger value={1}>Provider</TabsTrigger>
          )}
          <TabsTrigger value={props.isProvider ? 2 : 1}>
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0} className="mt-4 space-y-4">
          <AvatarUpload />
          <ProfileForm />
        </TabsContent>

        {props.isProvider && (
          <TabsContent value={1} className="mt-4">
            <ProviderProfileForm />
          </TabsContent>
        )}

        <TabsContent
          value={props.isProvider ? 2 : 1}
          className="mt-4"
        >
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
