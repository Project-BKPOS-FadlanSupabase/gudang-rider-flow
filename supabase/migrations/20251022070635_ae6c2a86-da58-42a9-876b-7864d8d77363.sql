-- Add status column to returns table
ALTER TABLE public.returns 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create index for better query performance
CREATE INDEX idx_returns_status ON public.returns(status);

-- Update the handle_return trigger function to only process approved returns
CREATE OR REPLACE FUNCTION public.handle_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if status is approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Add back to warehouse stock
    UPDATE public.warehouse_stock
    SET quantity = quantity + NEW.quantity,
        updated_at = NOW()
    WHERE product_id = NEW.product_id;
    
    -- Remove from rider inventory
    UPDATE public.rider_inventory
    SET quantity = GREATEST(0, quantity - NEW.quantity),
        updated_at = NOW()
    WHERE rider_id = NEW.rider_id AND product_id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one for UPDATE
DROP TRIGGER IF EXISTS handle_return_trigger ON public.returns;
CREATE TRIGGER handle_return_trigger
AFTER INSERT OR UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.handle_return();