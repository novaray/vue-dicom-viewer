<script setup lang="ts">
interface Props {
  text?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="spinner-wrap">
    <span class="loader"/>
    <sub
      v-if="text"
      class="loading-text"
    >
    {{ text }}
  </sub>
  </div>
</template>

<style scoped lang="scss">
.spinner-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 1rem;
  gap: 0.3rem;
}

.loader {
  width: 85px;
  height: 50px;
  position: relative;
  background-repeat: no-repeat;
  background-image: linear-gradient(#A9A9A9 50px, transparent 0),
  linear-gradient(#A9A9A9 50px, transparent 0),
  linear-gradient(#A9A9A9 50px, transparent 0),
  linear-gradient(#A9A9A9 50px, transparent 0),
  linear-gradient(#A9A9A9 50px, transparent 0),
  linear-gradient(#A9A9A9 50px, transparent 0);
  background-position: 0px center, 15px center, 30px center, 45px center, 60px center, 75px center, 90px center;
  animation: rikSpikeRoll 0.65s linear infinite alternate;
}

@keyframes rikSpikeRoll {
  0% {
    background-size: 10px 3px;
  }
  16% {
    background-size: 10px 50px, 10px 3px, 10px 3px, 10px 3px, 10px 3px, 10px 3px
  }
  33% {
    background-size: 10px 30px, 10px 50px, 10px 3px, 10px 3px, 10px 3px, 10px 3px
  }
  50% {
    background-size: 10px 10px, 10px 30px, 10px 50px, 10px 3px, 10px 3px, 10px 3px
  }
  66% {
    background-size: 10px 3px, 10px 10px, 10px 30px, 10px 50px, 10px 3px, 10px 3px
  }
  83% {
    background-size: 10px 3px, 10px 3px, 10px 10px, 10px 30px, 10px 50px, 10px 3px
  }
  100% {
    background-size: 10px 3px, 10px 3px, 10px 3px, 10px 10px, 10px 30px, 10px 50px
  }
}

.loading-text {
  color: #A9A9A9;
  align-self: center;
}
</style>
