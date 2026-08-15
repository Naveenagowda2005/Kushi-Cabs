-- Check if documents table has RLS and what policies exist
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'documents' AND schemaname = 'public';

-- Allow drivers to insert their own documents
CREATE POLICY "drivers_can_insert_documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow drivers to read their own documents  
CREATE POLICY "drivers_can_read_documents"
ON public.documents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
