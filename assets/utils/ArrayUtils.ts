
type GroupList<T extends any> = {
  [key in keyof T]: []
}
export class ArrayUtils {
  static groupBy<T, K extends keyof T>(list: T[], type: K) {
    let groupList: GroupList<T> | any = {}
    list.forEach(item => {
      const itemType = item[type]
      if (Reflect.ownKeys(groupList).indexOf(String(itemType))! == -1) {
        groupList[itemType] = [item]
      } else {
        groupList[itemType].push(item)
      }
    })
    return groupList
  }
}
