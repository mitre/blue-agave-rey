<template>
  <div class="date-time-picker-control">
    <div class="datetime-dialog">
      <div class="pick-button">
        <Calendar color="#737373"/>
      </div>
      <div class="date">{{ selectedDate }}</div>
      <div class="time">{{ selectedTime }}</div>
    </div>
    <div class="input-container">
      <input
        ref="picker"
        type="datetime-local"
        :min="formatDate(min)"
        :max="formatDate(max)"
        :value="formatDate(value)"
        @change="onValueChange" 
      />
    </div>
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, Ref, ref } from 'vue';
import { 
  formatDateCal,
  format12HourTime, 
  format24HourTime
} from '@/assets/scripts/Visualizations/Time';
// Components
import Calendar from "@/components/Icons/Calendar.vue";

// TODO: Improve browser cross-compatibility. Add 12/24 hour time support.

export default defineComponent({
  name: 'DateTimePicker',
  setup() {
    return { 
      picker: ref(null) as Ref<HTMLInputElement | null> 
    }
  },
  props: {
    min: {
      type: Date,
      required: true
    },
    max: {
      type: Date,
      required: true
    },
    value: {
      type: Date,
      default: new Date()
    },
    use24HourTime: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    
    /**
     * Returns the selected date formatted as a string.
     * @returns
     *  The selected date formatted as a string.
     */
    selectedDate(): string {
      return formatDateCal(this.value);
    },
    
    /**
     * Returns the selected time formatted as a string.
     * @returns
     *  The selected time formatted as a string.
     */
    selectedTime(): string {
      return this.use24HourTime ? 
        format24HourTime(this.value, 0) : 
        format12HourTime(this.value, 0);
    }

  },
  emits: ["change"],
  methods: {
    
    /**
     * Date / Time selection behavior.
     */
    onValueChange() {
      this.$emit("change", new Date(this.picker!.value));
    },

    /**
     * Formats a Date as an DateTime <input> string.
     * @param date
     *  The date to format.
     * @returns
     *  The date formatted as a DateTime <input> string.
     */
    formatDate(date: Date): string {
      if(date !== undefined) {
        let parse = new Date(date.getTime() - (60000 * date.getTimezoneOffset()));
        return parse.toISOString().match(/[0-9]+-[0-9]+-[0-9]+T[0-9]+:[0-9]+/)![0]
      } else {
        return "";
      }
    }

  },
  watch: {
    // On min time change
    min(value) {
      if(this.value.getTime() < value.getTime()) {
        this.$emit("change", value);
      }
    },
    // On max time change
    max(value) {
      if(value.getTime() < this.value.getTime()) {
        this.$emit("change", value);
      }
    }
  },
  components: { Calendar }
});
</script>

<style scoped>

/** === Main Control === */

.date-time-picker-control {
  position: relative;
  overflow: hidden;
  user-select: none;
}

.datetime-dialog {
  display: inline-flex;
  height: 28px;
  border: solid 1px #4d4d4d;
  border-radius: 3px;
  overflow: hidden;
}

.pick-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 100%;
  border-right: solid 1px #4d4d4d;
  background: #323232;
}

.date {
  width: 100px;
  height: 100%;
  color: #999999;
  font-size: 11pt;
  font-weight: 500;
  text-align: center;
  line-height: 28px;
  border-right: solid 1px #4d4d4d;
}

.time {
  width: 90px;
  height: 100%;
  color: #bfbfbf;
  font-size: 11pt;
  font-weight: 700;
  text-align: center;
  line-height: 28px;
}

.input-container {
  position: absolute;
  top: 3px;
  left: 0px;
  width: 26px;
  height: 24px;
  overflow: hidden;
}

input {
  position: relative;
  left: -24px;
  width: 46px;
  opacity: 0;
  /* transform: rotateY(180deg); */
}

</style>
