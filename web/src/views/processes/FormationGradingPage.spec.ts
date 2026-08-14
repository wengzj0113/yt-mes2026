import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FormationGradingPage from './FormationGradingPage.vue'

vi.mock('./ProcessFormPage.vue', () => ({
  default: defineComponent({
    name: 'FormationGradingFormStub',
    props: ['basePath', 'processName', 'fieldGroups', 'formVariant', 'dataTestid', 'batchNo'],
    template: `
      <div :data-testid="dataTestid" :class="formVariant">
        <div v-for="group in fieldGroups" :key="group.key" class="field-group">
          <h3>{{ group.label }}</h3>
          <span v-for="field in group.fieldKeys" :key="field">{{ field }}</span>
        </div>
      </div>
    `,
  }),
}))

describe('FormationGradingPage', () => {
  it('configures the three Excel-defined parameter groups', () => {
    const wrapper = mount(FormationGradingPage, { props: { batchNo: 'BAT-649729' } })

    expect(wrapper.find('[data-testid="formation-grading-form"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('活化参数')
    expect(wrapper.text()).toContain('化成分容参数')
    expect(wrapper.text()).toContain('分容结果参数')
    expect(wrapper.findAll('.field-group')).toHaveLength(3)
  })
})
