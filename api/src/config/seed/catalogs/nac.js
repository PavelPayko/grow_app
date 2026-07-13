/**
 * NAC competency catalog (Матрица_оценки_компетенций.xlsx).
 * Добавляйте другие каталоги рядом: seed/catalogs/<name>.js
 */

const NAC_CATALOG_NAME = 'NAC'

const NAC_GRADE_TARGETS = {
  'NAC Core': {
    junior: [0.7, 1.4],
    middle: [1.5, 2.2],
    senior: [2.3, 3.0],
  },
  'Access Control': {
    junior: [0.8, 1.5],
    middle: [1.6, 2.3],
    senior: [2.4, 3.0],
  },
  'Network integration': {
    junior: [0.6, 1.3],
    middle: [1.4, 2.2],
    senior: [2.3, 3.0],
  },
  'Solution Delivery & Support': {
    junior: [0.7, 1.4],
    middle: [1.5, 2.2],
    senior: [2.3, 3.0],
  },
  'Teamwork & Soft skills': {
    junior: [1.2, 1.8],
    middle: [1.9, 2.4],
    senior: [2.5, 3.0],
  },
}

const NAC_COMPETENCIES = [
  { block: 'NAC Core', domain: 'NAC / AxelNAC', name: 'Понимание продукта и модулей', weight: 1.5, criterion: 'Понимает архитектуру AxelNAC, взаимосвязь AAA/Captive/Posturing/TACACS' },
  { block: 'NAC Core', domain: 'NAC / Astra Linux', name: 'Администрирование', weight: 1.5, criterion: 'Сервисы, логи, сеть, обновление, HA' },
  { block: 'NAC Core', domain: 'PKI', name: 'PKI-инфраструктура', weight: 1.5, criterion: 'Работа с центрами сертификации, OCSP, атрибуты сертификатов' },
  { block: 'NAC Core', domain: 'Posturing', name: 'Windows (WinRS)', weight: 1.5, criterion: 'Проверки соответствия для Windows через WinRS, сценарии, GPO' },
  { block: 'NAC Core', domain: 'Posturing', name: 'Linux (SSH)', weight: 1.5, criterion: 'Проверки соответствия для Linux через SSH, ключи/доступ' },
  { block: 'NAC Core', domain: 'Служба каталогов', name: 'MS AD интеграция', weight: 1.5, criterion: 'Ввод в домен, LDAP-чтение, группы/OU, атрибуты' },
  { block: 'NAC Core', domain: 'Служба каталогов', name: 'ALD Pro интеграция и другие Linux каталоги', weight: 1.0, criterion: 'Интеграция, особенности' },
  { block: 'NAC Core', domain: 'Супликанты', name: 'Windows/Linux 802.1X', weight: 1.0, criterion: 'Настройка supplicant на Win/Linux, профили, контейнеры сертификатов' },
  { block: 'Access Control', domain: 'AAA / 802.1X', name: 'EAP-TLS', weight: 2.0, criterion: 'Настройка EAP, цепочка доверия' },
  { block: 'Access Control', domain: 'AAA / 802.1X', name: 'PEAP-MSCHAPv2', weight: 1.5, criterion: 'Настройка PEAP, политики, диагностика типовых ошибок' },
  { block: 'Access Control', domain: 'AAA / RADIUS', name: 'Политики и фильтрация', weight: 2.0, criterion: 'Расширенная фильтрация, атрибуты RADIUS, ACL' },
  { block: 'Access Control', domain: 'Captive Portal', name: 'Guest', weight: 1.0, criterion: 'Сценарии гостевого доступа (спонсор, 2FA), портал, политики' },
  { block: 'Access Control', domain: 'Captive Portal', name: 'BYOD', weight: 1.5, criterion: 'Портал, политики, агент инициализации, работа со SCEP' },
  { block: 'Access Control', domain: 'TACACS', name: 'AAA', weight: 1.0, criterion: 'Настройка TACACS, роли, аудит' },
  { block: 'Network integration', domain: 'Networking', name: 'Базовые знания при работе с сетями', weight: 2.0, criterion: 'Знанение стека TCP/IP, фрагментация и инкапсуляция пакетов, понимание DHCP/DNS' },
  { block: 'Network integration', domain: 'SW, RT', name: 'Cisco', weight: 1.5, criterion: '802.1X/MAB, critical VLAN, multi-auth, шаблоны' },
  { block: 'Network integration', domain: 'SW, RT', name: 'Huawei', weight: 1.5, criterion: '802.1X/MAC-auth, политики, шаблоны' },
  { block: 'Network integration', domain: 'SW, RT', name: 'Eltex/SNR/Qtech/H3C/Juniper', weight: 1.0, criterion: 'Базовая настройка NAC-интеграции по гайдам' },
  { block: 'Network integration', domain: 'AP, WLC', name: 'Cisco/Aruba/Ubiquiti/Huawei/Eltex', weight: 2.0, criterion: 'Интеграция Wi‑Fi с NAC (802.1X/portal)' },
  { block: 'Solution Delivery & Support', domain: 'Troubleshooting', name: 'Методология', weight: 2.0, criterion: 'Сбор фактов, гипотезы, RCA (Root Cause Analysis)' },
  { block: 'Solution Delivery & Support', domain: 'Troubleshooting', name: 'Packet capture', weight: 1.5, criterion: 'Снятие/анализ pcap (RADIUS/EAP), интерпретация' },
  { block: 'Solution Delivery & Support', domain: 'Пилоты/Внедрения', name: 'PoC планирование', weight: 1.5, criterion: 'План, критерии успеха, риски, тайминг' },
  { block: 'Solution Delivery & Support', domain: 'Пилоты/Внедрения', name: 'Демо на стендах и консультация', weight: 1.0, criterion: 'Подготовка/ведение демо на преднастроенных стендах' },
  { block: 'Solution Delivery & Support', domain: 'Документация', name: 'Vendor-specific гайды', weight: 1.5, criterion: 'Документация по вендорам, runbooks, актуализация' },
  { block: 'Solution Delivery & Support', domain: 'R&D поддержка', name: 'Воспроизведение багов/стенды', weight: 1.0, criterion: 'Repro steps, логи, подготовка физ/вирт стендов' },
  { block: 'Teamwork & Soft skills', domain: 'Коммуникации', name: 'Заказчик (почта/чаты)', weight: 2.0, criterion: 'Чёткие статусы, отчёты, управление ожиданиями' },
  { block: 'Teamwork & Soft skills', domain: 'Коммуникации', name: 'Внутри команды', weight: 1.0, criterion: 'Передача знаний, синхронизация' },
  { block: 'Teamwork & Soft skills', domain: 'Гибкие навыки', name: 'Ответственность', weight: 1.5, criterion: 'Берёт ответственность за зону/результат, инициатива' },
  { block: 'Teamwork & Soft skills', domain: 'Гибкие навыки', name: 'Наставничество', weight: 1.0, criterion: 'Обучает, ревьюит, помогает расти' },
]

module.exports = {
  NAC_CATALOG_NAME,
  NAC_GRADE_TARGETS,
  NAC_COMPETENCIES,
}
