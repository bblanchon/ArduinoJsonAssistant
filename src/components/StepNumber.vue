<template>
  <div class="assistant-step">
    <RouterLink :to="route" class="btn" aria-current-value="step">
      {{ number }}
    </RouterLink>
    <p>
      <small>{{ label }}</small>
    </p>
  </div>
</template>

<script>
import { RouterLink } from "vue-router";

export default {
  components: { RouterLink },
  props: {
    route: {
      type: Object,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss">
$primary: #00878f;
$secondary: #8c7965;

.assistant-step {
  width: 5em;
  text-align: center;

  p {
    margin-top: 0px;
    color: #666;
  }

  .btn {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    background-color: $secondary;
    width: 30px;
    height: 30px;
    border-radius: 15px;
    color: white;
    border: none;

    &:focus {
      outline: none;
      box-shadow: 0 0 8px $secondary;
    }

    &:hover {
      text-decoration: none;
    }

    &.active {
      background-color: $primary;
      font-weight: bold;

      &:focus {
        box-shadow: 0 0 8px $primary;
      }
    }
  }
}
</style>
