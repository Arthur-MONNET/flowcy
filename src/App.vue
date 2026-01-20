<template>
  <div class="flex h-screen w-screen">
    <div class="w-full max-w-sm">
      <Sidebar />
    </div>
    <div class="flex-1">
      <MapView />
    </div>
  </div>
</template>

<script setup lang="ts">
import MapView from './components/MapView.vue';
import Sidebar from './components/Sidebar.vue';
</script>
