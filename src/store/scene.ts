import { defineStore } from 'pinia'
import type { FormModelType } from '@/views/rule-engine/Scene/typings'
import { detail } from '@/api/rule-engine/scene'
import { cloneDeep, isArray } from 'lodash-es'
import { randomString } from '@/utils/utils'

type DataType = {
  data: FormModelType | any
  productCache: any
}

const assignmentKey = (data: any[]): any[] => {
  const onlyKey = ['when', 'then', 'terms', 'actions'];
  if (!data) return [];

  return data.map((item: any) => {
    if (item) {
      item.key = randomString();
      Object.keys(item).some((key) => {
        if (onlyKey.includes(key) && isArray(item[key])) {
          item[key] = assignmentKey(item[key]);
        }
      });
    }
    return item;
  });
};

export const defaultBranches = [
  {
    when: [
      {
        terms: [
          {
            column: undefined,
            value: {
              source: 'fixed',
              value: undefined
            },
            termType: undefined,
            key: 'params_1',
            type: 'and',
          },
        ],
        type: 'and',
        key: 'terms_1',
      },
    ],
    key: 'branches_1',
    shakeLimit: {
      enabled: false,
      time: 1,
      threshold: 1,
      alarmFirst: false,
    },
    then: [],
  },
];

const defaultOptions = {
  trigger: {},
  when: [
    {
      terms: [
        {
          terms: [['','eq','','and']],
        },
      ],
    },
  ],
};

export const useSceneStore = defineStore('scene', () => {
  const data = ref<FormModelType>({
    trigger: { type: ''},
    options: defaultOptions,
    branches: defaultBranches,
    description: '',
    name: '',
    id: undefined
  })

  const productCache = {}

  const refresh = () => {
    data.value = {
      trigger: { type: ''},
      options: cloneDeep(defaultOptions),
      branches: cloneDeep(defaultBranches),
      description: '',
      name: '',
      id: undefined
    }
  }

  const getDetail = async (id: string) => {
    refresh()
    const resp = await detail(id)
    if (resp.success) {
      const result = resp.result as any
      const triggerType = result.triggerType
      let branches: any[] = result.branches

      if (!branches) {
        branches = cloneDeep(defaultBranches)
        if (triggerType === 'device') {
          branches.push(null)
        } else {
          branches[0].when.length = []
        }
      } else {
        const branchesLength = branches.length;
        if (
          triggerType === 'device' &&
          ((branchesLength === 1 && branches[0]?.when?.length) || // 有一组数据并且when有值
            (branchesLength > 1 && branches[branchesLength - 1]?.when?.length)) // 有多组否则数据，并且最后一组when有值
        ) {
          branches.push(null);
        }
      }
      console.log(branches)
      data.value = {
        ...result,
        trigger: result.trigger || {},
        branches: cloneDeep(assignmentKey(branches)),
        options: result.options ? {...cloneDeep(defaultOptions), ...result.options } : cloneDeep(defaultOptions),
      }
    }
  }

  return {
    data,
    productCache,
    getDetail,
    refresh
  }
})
