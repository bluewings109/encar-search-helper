"""목록 API 응답의 Year(YYYYMM)/Mileage만으로 차량 경과기간과 연간 주행거리를
계산한다(상세 API 호출 불필요). 로직은 크롬 익스텐션의 extension/src/mileage.js를
그대로 포팅했다."""

from datetime import datetime


def age_in_months(year_month, now=None):
    """year_month: 202107.0 형태(YYYYMM)의 Year 필드."""
    now = now or datetime.now()
    yyyymm = int(year_month)
    year, month = divmod(yyyymm, 100)
    months = (now.year - year) * 12 + (now.month - month)
    return max(months, 1)


def format_age(months):
    years, remain = divmod(months, 12)
    if years == 0:
        return f"{remain}개월차"
    if remain == 0:
        return f"{years}년차"
    return f"{years}년 {remain}개월차"


def annual_mileage(mileage, months):
    if mileage is None:
        return None
    return round(mileage * 12 / months)
