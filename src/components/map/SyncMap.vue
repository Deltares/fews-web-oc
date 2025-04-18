<script setup lang="ts">
import { useMap } from '@/services/useMap'
import { useMapSync } from '@/services/useMapSync'

const { map } = useMap()

useMapSync(map)
</script>
