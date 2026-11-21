import { faDate, faNum, faPercent, faToman } from "./format";
import { CATEGORY_LABEL, DOC_LABEL, STATUS_LABEL } from "./labels";
import { isLowStock, materialCost, snapshot, stockOf } from "./metrics";
import type { ProjectState } from "./types";

function rows(items: Record<string, string | number>[]) {
  return items;
}

export async function exportWorkbook(state: ProjectState) {
  const XLSX = await import("xlsx");
  const view = snapshot(state);
  const book = XLSX.utils.book_new();

  const add = (name: string, data: Record<string, string | number>[]) => {
    const sheet = XLSX.utils.json_to_sheet(data.length ? data : [{ توضیح: "موردی نیست" }]);
    XLSX.utils.book_append_sheet(book, sheet, name.slice(0, 31));
  };

  add("خلاصه", rows([
    { شاخص: "پروژه", مقدار: state.project.name },
    { شاخص: "کد", مقدار: state.project.code },
    { شاخص: "پیشرفت", مقدار: faPercent(view.progress) },
    { شاخص: "بودجه", مقدار: faToman(view.budget, "full") },
    { شاخص: "هزینه انجام‌شده", مقدار: faToman(view.spent, "full") },
    { شاخص: "مانده", مقدار: faToman(view.remaining, "full") },
    { شاخص: "پیش‌بینی اتمام", مقدار: faToman(view.forecast, "full") },
    { شاخص: "انحراف پیش‌بینی", مقدار: faToman(view.variance, "full") },
  ]));

  add("طبقات", state.floors
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((floor) => ({
      طبقه: floor.name,
      کاربری: floor.program,
      متراژ: floor.area,
      پیشرفت: faPercent(floor.progress, 0),
      وضعیت: STATUS_LABEL[floor.status],
      اسکلت: faPercent(floor.structure, 0),
      دیوار: faPercent(floor.masonry, 0),
      تأسیسات: faPercent(floor.mep, 0),
      نازک‌کاری: faPercent(floor.finishing, 0),
    })));

  add("مالی", state.expenses.map((expense) => ({
    عنوان: expense.title,
    دسته: CATEGORY_LABEL[expense.category],
    مبلغ: expense.amount,
    تاریخ: faDate(expense.date),
    فروشنده: expense.vendor,
    توضیح: expense.note,
  })));

  add("مصالح", state.materials.map((item) => ({
    کالا: item.name,
    دسته: item.category,
    موردنیاز: item.required,
    خرید: item.purchased,
    مصرف: item.consumed,
    موجودی: stockOf(item),
    واحد: item.unit,
    فی: item.unitPrice,
    مبلغ: materialCost(item),
    هشدار: isLowStock(item) ? "کمبود" : "",
    تأمین‌کننده: item.supplier,
  })));

  add("تأخیرها", state.stages.filter((stage) => stage.status === "delayed" || stage.delayDays > 0).map((stage) => ({
    مرحله: stage.name,
    وضعیت: STATUS_LABEL[stage.status],
    تأخیر: faNum(stage.delayDays),
    پیشرفت: faPercent(stage.progress, 0),
    پایان: faDate(stage.endDate),
  })));

  add("عملیات", state.logs.map((log) => ({
    تاریخ: faDate(log.date),
    هوا: log.weather,
    نفرات: log.crew,
    شرح: log.summary,
    مانع: log.issues,
  })));

  add("اسناد", state.documents.map((doc) => ({
    عنوان: doc.title,
    دسته: DOC_LABEL[doc.category],
    ویرایش: doc.revision,
    تاریخ: faDate(doc.date),
    حجم: doc.size,
  })));

  XLSX.writeFile(book, `${state.project.code}-report.xlsx`);
}
