import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { query, initHostelMessTables } from '../config/db';

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 1. Get Daily Menu (For Hostellers & Warden)
export const getDailyMenu = async (req: AuthenticatedRequest, res: Response) => {
  const targetDate = (req.query.date as string) || getTodayString();

  try {
    await initHostelMessTables();
    const result = await query(
      `SELECT meal_type, menu_items, created_at FROM hostel_menus WHERE date = $1`,
      [targetDate]
    );

    const menuMap: Record<string, string> = {
      BREAKFAST: 'Puri / Idli with Chutney & Sambhar, Tea / Coffee',
      LUNCH: 'Steamed Rice, Dal Tadka, Paneer / Veg Curry, Curd & Papad',
      DINNER: 'Roti, Mixed Veg Curry, Rice, Rasam & Sweet'
    };

    for (const row of result.rows) {
      menuMap[row.meal_type] = row.menu_items;
    }

    res.json({
      success: true,
      data: {
        date: targetDate,
        breakfast: menuMap.BREAKFAST,
        lunch: menuMap.LUNCH,
        dinner: menuMap.DINNER
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// 2. Update Daily Menu (Warden / Admin only)
export const updateDailyMenu = async (req: AuthenticatedRequest, res: Response) => {
  const { date, mealType, menuItems } = req.body;

  const targetDate = date || getTodayString();
  const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];

  if (!mealType || !validMealTypes.includes(mealType) || !menuItems) {
    return res.status(400).json({ success: false, message: 'Valid mealType (BREAKFAST, LUNCH, DINNER) and menuItems are required.', code: 'INVALID_INPUT' });
  }

  try {
    await initHostelMessTables();
    await query(
      `INSERT INTO hostel_menus (date, meal_type, menu_items)
       VALUES ($1, $2, $3)
       ON CONFLICT (date, meal_type)
       DO UPDATE SET menu_items = EXCLUDED.menu_items, created_at = CURRENT_TIMESTAMP`,
      [targetDate, mealType, menuItems.trim()]
    );

    res.json({ success: true, message: `${mealType} menu updated successfully for ${targetDate}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// 3. Get Hosteller Meal RSVP for Date
export const getHostellerMealRsvp = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const targetDate = (req.query.date as string) || getTodayString();

  try {
    await initHostelMessTables();
    const result = await query(
      `SELECT meal_type, will_eat FROM hostel_meal_rsvps WHERE user_id = $1 AND date = $2`,
      [userId, targetDate]
    );

    const rsvpState: Record<string, boolean> = {
      BREAKFAST: true,
      LUNCH: true,
      DINNER: true
    };

    for (const row of result.rows) {
      rsvpState[row.meal_type] = row.will_eat;
    }

    res.json({
      success: true,
      data: {
        date: targetDate,
        rsvps: rsvpState
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// 4. Update Meal RSVP (Hosteller Opt-in / Opt-out)
export const updateMealRsvp = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { date, mealType, willEat } = req.body;

  const targetDate = date || getTodayString();
  const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER'];

  if (!mealType || !validMealTypes.includes(mealType) || typeof willEat !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Valid mealType and boolean willEat status are required.', code: 'INVALID_INPUT' });
  }

  try {
    await initHostelMessTables();
    await query(
      `INSERT INTO hostel_meal_rsvps (user_id, date, meal_type, will_eat)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date, meal_type)
       DO UPDATE SET will_eat = EXCLUDED.will_eat, updated_at = CURRENT_TIMESTAMP`,
      [userId, targetDate, mealType, willEat]
    );

    res.json({
      success: true,
      message: `Meal preference for ${mealType} updated to: ${willEat ? 'Yes, I will eat' : 'No, I won\'t eat'}`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};

// 5. Get Warden Mess Headcount Summary & Opt-out Audit
export const getWardenMessSummary = async (req: AuthenticatedRequest, res: Response) => {
  const targetDate = (req.query.date as string) || getTodayString();

  try {
    await initHostelMessTables();

    // Total Hostellers count
    const hostellerCountRes = await query(
      `SELECT COUNT(*) FROM users u
       LEFT JOIN seniors s ON u.id = s.user_id
       LEFT JOIN juniors j ON u.id = j.user_id
       WHERE (s.residence_status = 'HOSTELLER' OR j.residence_status = 'HOSTELLER') AND u.is_active = true`
    );
    const totalHostellers = parseInt(hostellerCountRes.rows[0].count) || 0;

    // Get all RSVPs for date
    const rsvpRes = await query(
      `SELECT r.meal_type, r.will_eat, u.name, u.email, u.phone, u.role,
              COALESCE(j.register_number, s.senior_code) as code
       FROM hostel_meal_rsvps r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN seniors s ON u.id = s.user_id
       LEFT JOIN juniors j ON u.id = j.user_id
       WHERE r.date = $1`,
      [targetDate]
    );

    const summary = {
      date: targetDate,
      totalHostellers,
      meals: {
        BREAKFAST: { eating: totalHostellers, optOut: 0, optOutStudents: [] as any[] },
        LUNCH: { eating: totalHostellers, optOut: 0, optOutStudents: [] as any[] },
        DINNER: { eating: totalHostellers, optOut: 0, optOutStudents: [] as any[] }
      }
    };

    for (const row of rsvpRes.rows) {
      const meal = row.meal_type as 'BREAKFAST' | 'LUNCH' | 'DINNER';
      if (summary.meals[meal]) {
        if (!row.will_eat) {
          summary.meals[meal].optOut += 1;
          summary.meals[meal].optOutStudents.push({
            name: row.name,
            email: row.email,
            phone: row.phone,
            role: row.role,
            code: row.code
          });
        }
      }
    }

    // Calculate expected eating headcount
    summary.meals.BREAKFAST.eating = Math.max(0, totalHostellers - summary.meals.BREAKFAST.optOut);
    summary.meals.LUNCH.eating = Math.max(0, totalHostellers - summary.meals.LUNCH.optOut);
    summary.meals.DINNER.eating = Math.max(0, totalHostellers - summary.meals.DINNER.optOut);

    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, code: 'SERVER_ERROR' });
  }
};
